import type {
  LlmProvider,
  LlmChatPayload,
  LlmChatResult,
  LlmProviderConfigs,
} from '../../shared/llm';

/**
 * LlmManager — thin HTTP layer for Anthropic, OpenAI, Gemini.
 * No SDKs — plain fetch so bundle stays small.
 */
export class LlmManager {
  private configs: LlmProviderConfigs = {};

  setConfigs(configs: LlmProviderConfigs) {
    this.configs = configs;
  }

  getConfigs(): LlmProviderConfigs {
    return this.configs;
  }

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
      return {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        provider,
        model: payload.model,
      };
    }
  }

  /* ------------------------------------------------------------------ */
  /* Anthropic                                                           */
  /* ------------------------------------------------------------------ */

  private async callAnthropic(
    payload: LlmChatPayload,
    apiKey: string,
  ): Promise<LlmChatResult> {
    const systemMsg = payload.messages.find((m) => m.role === 'system');
    const messages = payload.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model: payload.model,
      max_tokens: payload.maxTokens ?? 4096,
      messages,
    };
    if (systemMsg) body['system'] = systemMsg.content;
    if (payload.temperature !== undefined) body['temperature'] = payload.temperature;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const errObj = data['error'] as Record<string, unknown> | undefined;
      return {
        ok: false,
        error: (errObj?.['message'] as string) ?? `HTTP ${res.status}`,
        provider: 'anthropic',
        model: payload.model,
      };
    }

    const content = (data['content'] as Array<{ type: string; text?: string }>)[0];
    const usage = data['usage'] as Record<string, number> | undefined;

    return {
      ok: true,
      text: content?.text ?? '',
      provider: 'anthropic',
      model: payload.model,
      inputTokens: usage?.['input_tokens'],
      outputTokens: usage?.['output_tokens'],
    };
  }

  /* ------------------------------------------------------------------ */
  /* OpenAI                                                              */
  /* ------------------------------------------------------------------ */

  private async callOpenAI(
    payload: LlmChatPayload,
    apiKey: string,
  ): Promise<LlmChatResult> {
    const body: Record<string, unknown> = {
      model: payload.model,
      messages: payload.messages.map((m) => ({ role: m.role, content: m.content })),
      max_completion_tokens: payload.maxTokens ?? 4096,
    };
    if (payload.temperature !== undefined) body['temperature'] = payload.temperature;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const errObj = data['error'] as Record<string, unknown> | undefined;
      return {
        ok: false,
        error: (errObj?.['message'] as string) ?? `HTTP ${res.status}`,
        provider: 'openai',
        model: payload.model,
      };
    }

    const choices = data['choices'] as Array<{ message: { content: string } }>;
    const usage = data['usage'] as Record<string, number> | undefined;

    return {
      ok: true,
      text: choices[0]?.message?.content ?? '',
      provider: 'openai',
      model: payload.model,
      inputTokens: usage?.['prompt_tokens'],
      outputTokens: usage?.['completion_tokens'],
    };
  }

  /* ------------------------------------------------------------------ */
  /* Gemini                                                              */
  /* ------------------------------------------------------------------ */

  private async callGemini(
    payload: LlmChatPayload,
    apiKey: string,
  ): Promise<LlmChatResult> {
    // Map messages: system → systemInstruction, rest → contents
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
    if (systemMsg) {
      body['systemInstruction'] = { parts: [{ text: systemMsg.content }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${payload.model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      const errObj = data['error'] as Record<string, unknown> | undefined;
      return {
        ok: false,
        error: (errObj?.['message'] as string) ?? `HTTP ${res.status}`,
        provider: 'gemini',
        model: payload.model,
      };
    }

    const candidates = data['candidates'] as Array<{
      content: { parts: Array<{ text: string }> };
    }>;
    const usageMeta = data['usageMetadata'] as Record<string, number> | undefined;

    return {
      ok: true,
      text: candidates[0]?.content?.parts[0]?.text ?? '',
      provider: 'gemini',
      model: payload.model,
      inputTokens: usageMeta?.['promptTokenCount'],
      outputTokens: usageMeta?.['candidatesTokenCount'],
    };
  }
}

export const llmManager = new LlmManager();
