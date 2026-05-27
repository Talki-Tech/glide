import { useGlideStore } from '../store/useGlideStore';
import { LLM_MODELS, type LlmProvider } from '../../shared/llm';

const PROVIDER_SHORT: Record<LlmProvider, string> = {
  anthropic: 'Claude',
  openai:    'GPT',
  gemini:    'Gemini',
};

/**
 * Bottom Windows-style status strip. Single line, no glassmorphism,
 * pulse dot + active LLM model + MCP service count.
 */
export function StatusBar() {
  const { status, llmConfigs, mcpServers } = useGlideStore();

  // Determine active provider label from configured keys
  const activeLlm = (() => {
    const providers: LlmProvider[] = ['anthropic', 'openai', 'gemini'];
    for (const p of providers) {
      const cfg = llmConfigs[p];
      if (cfg?.apiKey) {
        const modelId = cfg.defaultModel ?? LLM_MODELS[p][0].id;
        const model = LLM_MODELS[p].find((m) => m.id === modelId);
        return `${PROVIDER_SHORT[p]}: ${model?.name ?? modelId}`;
      }
    }
    return status.llm; // fallback to system status
  })();

  const connectedCount = mcpServers.filter((s) => s.status === 'connected').length;

  return (
    <footer className="glide-no-drag flex h-6 shrink-0 items-center justify-between border-t border-ink-800 bg-ink-900 px-3 text-[10.5px] text-ink-400">
      <div className="flex items-center gap-3">
        <span className="relative flex h-1.5 w-1.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-status-halo rounded-full bg-mint-400/60" />
          <span className="relative inline-flex h-1.5 w-1.5 animate-status-pulse rounded-full bg-mint-400" />
        </span>
        <span>
          <span className="font-medium text-ink-200">{activeLlm}</span>
        </span>
        <span className="text-ink-700">│</span>
        <span>
          <span className="font-medium text-ink-200">{connectedCount}</span> services
        </span>
      </div>

      <span className="font-mono text-ink-500">v0.1.0</span>
    </footer>
  );
}
