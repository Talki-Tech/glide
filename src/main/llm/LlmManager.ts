import type {
  LlmProvider,
  LlmChatPayload,
  LlmChatResult,
  LlmProviderConfigs,
} from '../../shared/llm';

/**
 * Gemini rejects JSON Schema fields it doesn't know ($schema, $id, etc).
 * Recursively strip them before sending.
 */
function stripForGemini(schema: Record<string, unknown>): Record<string, unknown> {
  const FORBIDDEN = new Set(['$schema', '$id', '$comment', '$defs', '$ref', 'additionalProperties', 'exclusiveMinimum', 'exclusiveMaximum']);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema)) {
    if (FORBIDDEN.has(k)) continue;
    if (k === 'properties' && typeof v === 'object' && v !== null) {
      const props: Record<string, unknown> = {};
      for (const [pk, pv] of Object.entries(v as Record<string, unknown>)) {
        props[pk] = typeof pv === 'object' && pv !== null
          ? stripForGemini(pv as Record<string, unknown>)
          : pv;
      }
      out[k] = props;
    } else if (k === 'items' && typeof v === 'object' && v !== null) {
      out[k] = stripForGemini(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export type StreamCallbacks = {
  onToken(delta: string): void;
  onToolCall(name: string, args: Record<string, unknown>): void;
  onDone(fullText: string, inputTokens?: number, outputTokens?: number): void;
  onError(err: string): void;
};

/** Tool definition passed to LLMs */
export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * LlmManager — HTTP layer for Anthropic, OpenAI, Gemini.
 * Supports streaming + tool use (function calling).
 */
export class LlmManager {
  private configs: LlmProviderConfigs = {};

  setConfigs(configs: LlmProviderConfigs) {
    this.configs = configs;
  }

  getConfigs(): LlmProviderConfigs {
    return this.configs;
  }

  /** Non-streaming chat (used for simple one-shot calls). */
  async chat(payload: LlmChatPayload): Promise<LlmChatResult> {
    const { provider } = payload;
    const cfg = this.configs[provider];
    if (!cfg?.apiKey) {
      return { ok: false, error: `No API key for ${provider}`, provider, model: payload.model };
    }
    try {
      switch (provider) {
        case 'anthropic': return await this.callAnthropic(payload, cfg.apiKey);
        case 'openai':    return await this.callOpenAI(payload, cfg.apiKey);
        case 'gemini':    return await this.callGemini(payload, cfg.apiKey);
        default:          return { ok: false, error: `Unknown provider: ${provider}`, provider, model: payload.model };
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err), provider, model: payload.model };
    }
  }

  /**
   * Streaming chat with optional tool use.
   * Calls callbacks as tokens/tool calls arrive.
   * Returns tool call requests so the caller can execute them and continue the loop.
   */
  async chatStream(
    payload: LlmChatPayload,
    tools: ToolDef[],
    cbs: StreamCallbacks,
  ): Promise<{ toolCalls: Array<{ name: string; args: Record<string, unknown>; id?: string }> }> {
    const { provider } = payload;
    const cfg = this.configs[provider];
    if (!cfg?.apiKey) {
      cbs.onError(`No API key for ${provider}`);
      return { toolCalls: [] };
    }
    try {
      switch (provider) {
        case 'anthropic': return await this.streamAnthropic(payload, cfg.apiKey, tools, cbs);
        case 'openai':    return await this.streamOpenAI(payload, cfg.apiKey, tools, cbs);
        case 'gemini':    return await this.streamGemini(payload, cfg.apiKey, tools, cbs);
        default:
          cbs.onError(`Unknown provider: ${provider}`);
          return { toolCalls: [] };
      }
    } catch (err) {
      cbs.onError(err instanceof Error ? err.message : String(err));
      return { toolCalls: [] };
    }
  }

  /* ------------------------------------------------------------------ */
  /* Anthropic — streaming + tool use                                    */
  /* ------------------------------------------------------------------ */

  private async streamAnthropic(
    payload: LlmChatPayload,
    apiKey: string,
    tools: ToolDef[],
    cbs: StreamCallbacks,
  ) {
    const systemMsg = payload.messages.find((m) => m.role === 'system');
    const messages = payload.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model: payload.model,
      max_tokens: payload.maxTokens ?? 4096,
      stream: true,
      messages,
    };
    if (systemMsg) body['system'] = systemMsg.content;
    if (payload.temperature !== undefined) body['temperature'] = payload.temperature;
    if (tools.length > 0) {
      body['tools'] = tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }));
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      const data = await res.json() as Record<string, unknown>;
      const errObj = data['error'] as Record<string, unknown> | undefined;
      cbs.onError((errObj?.['message'] as string) ?? `HTTP ${res.status}`);
      return { toolCalls: [] };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;
    const toolCalls: Array<{ name: string; args: Record<string, unknown>; id?: string }> = [];
    // Track partial tool_use blocks
    const partialTools: Record<number, { id: string; name: string; inputRaw: string }> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]' || !dataStr) continue;

        let evt: Record<string, unknown>;
        try { evt = JSON.parse(dataStr); } catch { continue; }

        const type = evt['type'] as string;

        if (type === 'message_start') {
          const msg = evt['message'] as Record<string, unknown> | undefined;
          const usage = msg?.['usage'] as Record<string, number> | undefined;
          inputTokens = usage?.['input_tokens'];
        }

        if (type === 'content_block_start') {
          const idx = evt['index'] as number;
          const block = evt['content_block'] as Record<string, unknown>;
          if (block['type'] === 'tool_use') {
            partialTools[idx] = {
              id: block['id'] as string,
              name: block['name'] as string,
              inputRaw: '',
            };
          }
        }

        if (type === 'content_block_delta') {
          const idx = evt['index'] as number;
          const delta = evt['delta'] as Record<string, unknown>;
          if (delta['type'] === 'text_delta') {
            const text = delta['text'] as string;
            fullText += text;
            cbs.onToken(text);
          }
          if (delta['type'] === 'input_json_delta') {
            if (partialTools[idx]) {
              partialTools[idx].inputRaw += delta['partial_json'] as string;
            }
          }
        }

        if (type === 'content_block_stop') {
          const idx = evt['index'] as number;
          if (partialTools[idx]) {
            const pt = partialTools[idx];
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(pt.inputRaw); } catch { /* empty args */ }
            toolCalls.push({ id: pt.id, name: pt.name, args });
            cbs.onToolCall(pt.name, args);
            delete partialTools[idx];
          }
        }

        if (type === 'message_delta') {
          const usage = (evt['usage'] as Record<string, number> | undefined);
          outputTokens = usage?.['output_tokens'];
        }
      }
    }

    cbs.onDone(fullText, inputTokens, outputTokens);
    return { toolCalls };
  }

  /* ------------------------------------------------------------------ */
  /* OpenAI — streaming + tool use                                       */
  /* ------------------------------------------------------------------ */

  private async streamOpenAI(
    payload: LlmChatPayload,
    apiKey: string,
    tools: ToolDef[],
    cbs: StreamCallbacks,
  ) {
    const body: Record<string, unknown> = {
      model: payload.model,
      messages: payload.messages.map((m) => ({ role: m.role, content: m.content })),
      max_completion_tokens: payload.maxTokens ?? 4096,
      stream: true,
      stream_options: { include_usage: true },
    };
    if (payload.temperature !== undefined) body['temperature'] = payload.temperature;
    if (tools.length > 0) {
      body['tools'] = tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      }));
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      const data = await res.json() as Record<string, unknown>;
      const errObj = data['error'] as Record<string, unknown> | undefined;
      cbs.onError((errObj?.['message'] as string) ?? `HTTP ${res.status}`);
      return { toolCalls: [] };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;
    const toolCalls: Array<{ name: string; args: Record<string, unknown>; id?: string }> = [];
    // Accumulate partial tool call arguments
    const partialCalls: Record<number, { id: string; name: string; argsRaw: string }> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]' || !dataStr) continue;

        let evt: Record<string, unknown>;
        try { evt = JSON.parse(dataStr); } catch { continue; }

        // Usage (last chunk)
        const usage = evt['usage'] as Record<string, number> | undefined;
        if (usage) {
          inputTokens = usage['prompt_tokens'];
          outputTokens = usage['completion_tokens'];
        }

        const choices = evt['choices'] as Array<Record<string, unknown>> | undefined;
        if (!choices?.length) continue;

        const delta = choices[0]['delta'] as Record<string, unknown> | undefined;
        if (!delta) continue;

        // Text delta
        if (typeof delta['content'] === 'string' && delta['content']) {
          fullText += delta['content'];
          cbs.onToken(delta['content']);
        }

        // Tool call deltas
        const tcDeltas = delta['tool_calls'] as Array<Record<string, unknown>> | undefined;
        if (tcDeltas) {
          for (const tc of tcDeltas) {
            const idx = tc['index'] as number;
            const fn = tc['function'] as Record<string, unknown> | undefined;
            if (!partialCalls[idx]) {
              partialCalls[idx] = { id: tc['id'] as string ?? '', name: '', argsRaw: '' };
            }
            if (fn?.['name']) partialCalls[idx].name = fn['name'] as string;
            if (fn?.['arguments']) partialCalls[idx].argsRaw += fn['arguments'] as string;
            if (tc['id']) partialCalls[idx].id = tc['id'] as string;
          }
        }

        const finishReason = choices[0]['finish_reason'] as string | undefined;
        if (finishReason === 'tool_calls') {
          for (const pc of Object.values(partialCalls)) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(pc.argsRaw); } catch { /* empty */ }
            toolCalls.push({ id: pc.id, name: pc.name, args });
            cbs.onToolCall(pc.name, args);
          }
        }
      }
    }

    cbs.onDone(fullText, inputTokens, outputTokens);
    return { toolCalls };
  }

  /* ------------------------------------------------------------------ */
  /* Gemini — streaming + tool use                                       */
  /* ------------------------------------------------------------------ */

  private async streamGemini(
    payload: LlmChatPayload,
    apiKey: string,
    tools: ToolDef[],
    cbs: StreamCallbacks,
  ) {
    const systemMsg = payload.messages.find((m) => m.role === 'system');
    const convMessages = payload.messages.filter((m) => m.role !== 'system');

    const contents = convMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: payload.maxTokens ?? 4096,
        ...(payload.temperature !== undefined ? { temperature: payload.temperature } : {}),
      },
    };
    if (systemMsg) body['systemInstruction'] = { parts: [{ text: systemMsg.content }] };
    if (tools.length > 0) {
      body['tools'] = [{
        functionDeclarations: tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: stripForGemini(t.inputSchema),
        })),
      }];
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${payload.model}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
      const data = await res.json() as Record<string, unknown>;
      const errObj = data['error'] as Record<string, unknown> | undefined;
      cbs.onError((errObj?.['message'] as string) ?? `HTTP ${res.status}`);
      return { toolCalls: [] };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let inputTokens: number | undefined;
    let outputTokens: number | undefined;
    const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();
        if (!dataStr) continue;

        let evt: Record<string, unknown>;
        try { evt = JSON.parse(dataStr); } catch { continue; }

        const candidates = evt['candidates'] as Array<Record<string, unknown>> | undefined;
        if (candidates?.length) {
          const content = candidates[0]['content'] as Record<string, unknown> | undefined;
          const parts = content?.['parts'] as Array<Record<string, unknown>> | undefined;
          for (const part of parts ?? []) {
            if (typeof part['text'] === 'string') {
              fullText += part['text'];
              cbs.onToken(part['text']);
            }
            if (part['functionCall']) {
              const fc = part['functionCall'] as Record<string, unknown>;
              const args = (fc['args'] ?? {}) as Record<string, unknown>;
              toolCalls.push({ name: fc['name'] as string, args });
              cbs.onToolCall(fc['name'] as string, args);
            }
          }
        }

        const meta = evt['usageMetadata'] as Record<string, number> | undefined;
        if (meta) {
          inputTokens = meta['promptTokenCount'];
          outputTokens = meta['candidatesTokenCount'];
        }
      }
    }

    cbs.onDone(fullText, inputTokens, outputTokens);
    return { toolCalls };
  }

  /* ------------------------------------------------------------------ */
  /* Non-streaming fallbacks                                             */
  /* ------------------------------------------------------------------ */

  private async callAnthropic(payload: LlmChatPayload, apiKey: string): Promise<LlmChatResult> {
    const systemMsg = payload.messages.find((m) => m.role === 'system');
    const messages = payload.messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content }));
    const body: Record<string, unknown> = { model: payload.model, max_tokens: payload.maxTokens ?? 4096, messages };
    if (systemMsg) body['system'] = systemMsg.content;
    if (payload.temperature !== undefined) body['temperature'] = payload.temperature;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      const e = data['error'] as Record<string, unknown> | undefined;
      return { ok: false, error: (e?.['message'] as string) ?? `HTTP ${res.status}`, provider: 'anthropic', model: payload.model };
    }
    const content = (data['content'] as Array<{ type: string; text?: string }>)[0];
    const usage = data['usage'] as Record<string, number> | undefined;
    return { ok: true, text: content?.text ?? '', provider: 'anthropic', model: payload.model, inputTokens: usage?.['input_tokens'], outputTokens: usage?.['output_tokens'] };
  }

  private async callOpenAI(payload: LlmChatPayload, apiKey: string): Promise<LlmChatResult> {
    const body: Record<string, unknown> = { model: payload.model, messages: payload.messages.map((m) => ({ role: m.role, content: m.content })), max_completion_tokens: payload.maxTokens ?? 4096 };
    if (payload.temperature !== undefined) body['temperature'] = payload.temperature;
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    const data = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      const e = data['error'] as Record<string, unknown> | undefined;
      return { ok: false, error: (e?.['message'] as string) ?? `HTTP ${res.status}`, provider: 'openai', model: payload.model };
    }
    const choices = data['choices'] as Array<{ message: { content: string } }>;
    const usage = data['usage'] as Record<string, number> | undefined;
    return { ok: true, text: choices[0]?.message?.content ?? '', provider: 'openai', model: payload.model, inputTokens: usage?.['prompt_tokens'], outputTokens: usage?.['completion_tokens'] };
  }

  private async callGemini(payload: LlmChatPayload, apiKey: string): Promise<LlmChatResult> {
    const systemMsg = payload.messages.find((m) => m.role === 'system');
    const convMessages = payload.messages.filter((m) => m.role !== 'system');
    const contents = convMessages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const body: Record<string, unknown> = { contents, generationConfig: { maxOutputTokens: payload.maxTokens ?? 4096, ...(payload.temperature !== undefined ? { temperature: payload.temperature } : {}) } };
    if (systemMsg) body['systemInstruction'] = { parts: [{ text: systemMsg.content }] };
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${payload.model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      const e = data['error'] as Record<string, unknown> | undefined;
      return { ok: false, error: (e?.['message'] as string) ?? `HTTP ${res.status}`, provider: 'gemini', model: payload.model };
    }
    const candidates = data['candidates'] as Array<{ content: { parts: Array<{ text: string }> } }>;
    const meta = data['usageMetadata'] as Record<string, number> | undefined;
    return { ok: true, text: candidates[0]?.content?.parts[0]?.text ?? '', provider: 'gemini', model: payload.model, inputTokens: meta?.['promptTokenCount'], outputTokens: meta?.['candidatesTokenCount'] };
  }
}

export const llmManager = new LlmManager();
