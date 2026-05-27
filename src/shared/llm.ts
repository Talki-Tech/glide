/**
 * Shared LLM provider types — used by main process and renderer.
 */

export type LlmProvider = 'anthropic' | 'openai' | 'gemini';

export interface LlmModel {
  id: string;
  name: string;
  contextWindow: number;
  note?: string; // 'flagship' | 'fast' | 'cheap' | 'reasoning'
}

export const LLM_MODELS: Record<LlmProvider, LlmModel[]> = {
  anthropic: [
    { id: 'claude-opus-4-7',   name: 'Claude Opus 4.7',   contextWindow: 1_000_000, note: 'flagship' },
    { id: 'claude-opus-4-6',   name: 'Claude Opus 4.6',   contextWindow: 1_000_000 },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', contextWindow: 1_000_000, note: 'balanced' },
    { id: 'claude-haiku-4-5',  name: 'Claude Haiku 4.5',  contextWindow: 200_000,   note: 'fast' },
  ],
  openai: [
    { id: 'gpt-5.5',       name: 'GPT-5.5',       contextWindow: 1_000_000, note: 'flagship' },
    { id: 'gpt-5.5-pro',   name: 'GPT-5.5 Pro',   contextWindow: 1_000_000, note: 'max' },
    { id: 'gpt-5.5-instant', name: 'GPT-5.5 Instant', contextWindow: 1_000_000, note: 'fast' },
    { id: 'gpt-5.4-mini',  name: 'GPT-5.4 Mini',  contextWindow: 128_000,   note: 'cheap' },
    { id: 'gpt-5.4-nano',  name: 'GPT-5.4 Nano',  contextWindow: 128_000,   note: 'cheapest' },
  ],
  gemini: [
    { id: 'gemini-3.5-flash',    name: 'Gemini 3.5 Flash',    contextWindow: 1_000_000, note: 'flagship' },
    { id: 'gemini-3.1-pro',      name: 'Gemini 3.1 Pro',      contextWindow: 2_000_000, note: 'reasoning' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', contextWindow: 1_000_000, note: 'fast' },
  ],
};

export interface LlmMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LlmChatPayload {
  provider: LlmProvider;
  model: string;
  messages: LlmMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface LlmChatResult {
  ok: boolean;
  text?: string;
  error?: string;
  provider: LlmProvider;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

/** Stored in settings — one entry per provider */
export interface LlmProviderConfig {
  apiKey: string;
  defaultModel: string;
}

export type LlmProviderConfigs = Partial<Record<LlmProvider, LlmProviderConfig>>;
