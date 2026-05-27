import type { ChatRequest, ChatResponse } from '../../shared/ipc.js';
import { llmManager } from '../llm/LlmManager.js';
import { LLM_MODELS, type LlmProvider } from '../../shared/llm.js';

/**
 * Chat handler — routes to the first configured LLM provider.
 * Priority: anthropic → openai → gemini.
 * Falls back to echo if no keys are set.
 */
export async function runChat(req: ChatRequest): Promise<ChatResponse> {
  const configs = llmManager.getConfigs();
  const providers: LlmProvider[] = ['anthropic', 'openai', 'gemini'];

  // Find first provider with a key
  const provider = providers.find((p) => configs[p]?.apiKey);

  if (!provider) {
    return {
      reply: {
        role: 'assistant',
        content:
          'No AI provider configured. Open Settings → AI Providers and add an API key.',
      },
    };
  }

  const cfg = configs[provider]!;
  const modelId = cfg.defaultModel ?? LLM_MODELS[provider][0].id;

  const result = await llmManager.chat({
    provider,
    model: modelId,
    messages: req.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    maxTokens: 4096,
  });

  if (!result.ok) {
    return {
      reply: {
        role: 'assistant',
        content: `Error from ${provider}: ${result.error ?? 'unknown error'}`,
      },
    };
  }

  return {
    reply: {
      role: 'assistant',
      content: result.text ?? '',
    },
  };
}
