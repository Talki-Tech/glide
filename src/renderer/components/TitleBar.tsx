import { GlideMark, CogIcon } from './icons';
import { useGlideStore } from '../store/useGlideStore';

/**
 * Windows-style title bar. Drag region across the strip,
 * settings cog + three control buttons (minimize, maximize, close)
 * docked to the right with Windows-native sizing (46×32).
 */
export function TitleBar() {
  const { view, setView } = useGlideStore();

  return (
    <div className="glide-drag flex h-8 w-full shrink-0 items-center justify-between border-b border-ink-800 bg-ink-900 select-none">
      {/* Left — app identity */}
      <div className="flex h-full items-center gap-2 pl-3">
        <GlideMark className="h-3.5 w-3.5 text-mint-400" />
        <span className="text-[11px] font-medium tracking-wide text-ink-200">Glide</span>
      </div>

      {/* Right — settings cog + window controls */}
      <div className="glide-no-drag flex h-full">
        <button
          onClick={() => setView(view === 'settings' ? 'palette' : 'settings')}
          className={`flex h-full w-[46px] items-center justify-center transition-colors ${
            view === 'settings'
              ? 'bg-ink-800 text-mint-300'
              : 'text-ink-200 hover:bg-ink-800 hover:text-mint-300'
          }`}
          aria-label="Settings"
          title="Settings"
        >
          <CogIcon className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => window.glide.window.minimize()}
          className="flex h-full w-[46px] items-center justify-center text-ink-200 transition-colors hover:bg-ink-800"
          aria-label="Minimize"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button
          onClick={() => window.glide.window.maximize()}
          className="flex h-full w-[46px] items-center justify-center text-ink-200 transition-colors hover:bg-ink-800"
          aria-label="Maximize"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" fill="none" />
          </svg>
        </button>
        <button
          onClick={() => window.glide.window.close()}
          className="flex h-full w-[46px] items-center justify-center text-ink-200 transition-colors hover:bg-[#e81123] hover:text-white"
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
