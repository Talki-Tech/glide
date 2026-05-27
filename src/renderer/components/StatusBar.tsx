import { useGlideStore } from '../store/useGlideStore';

/**
 * Bottom Windows-style status strip. Single line, no glassmorphism,
 * pulse dot + model + service count. Cog removed for clarity.
 */
export function StatusBar() {
  const { status } = useGlideStore();

  return (
    <footer className="glide-no-drag flex h-6 shrink-0 items-center justify-between border-t border-ink-800 bg-ink-900 px-3 text-[10.5px] text-ink-400">
      <div className="flex items-center gap-3">
        <span className="relative flex h-1.5 w-1.5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-status-halo rounded-full bg-mint-400/60" />
          <span className="relative inline-flex h-1.5 w-1.5 animate-status-pulse rounded-full bg-mint-400" />
        </span>
        <span>
          LLM: <span className="font-medium text-ink-200">{status.llm}</span>
        </span>
        <span className="text-ink-700">│</span>
        <span>
          <span className="font-medium text-ink-200">{status.connectedServices}</span> services
        </span>
      </div>

      <span className="font-mono text-ink-500">v0.1.0</span>
    </footer>
  );
}
