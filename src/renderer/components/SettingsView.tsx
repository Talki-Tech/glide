import { motion } from 'framer-motion';
import {
  useGlideStore,
  type AccentColor,
  type GlideSettings,
} from '../store/useGlideStore';
import {
  CogIcon,
  XIcon,
  GithubIcon,
  SlackIcon,
  VercelIcon,
  VSCodeIcon,
  CheckIcon,
} from './icons';
import type { ComponentType, SVGProps } from 'react';

interface SettingsViewProps {
  onExit(): void;
}

interface AccentSwatch {
  id: AccentColor;
  label: string;
  hex: string;
}

const ACCENT_SWATCHES: AccentSwatch[] = [
  { id: 'mint', label: 'Mint', hex: '#1FE39A' },
  { id: 'cyan', label: 'Cyan', hex: '#22D3EE' },
  { id: 'violet', label: 'Violet', hex: '#A78BFA' },
  { id: 'amber', label: 'Amber', hex: '#F59E0B' },
];

interface IntegrationRow {
  key: keyof GlideSettings['integrations'];
  label: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const INTEGRATIONS: IntegrationRow[] = [
  { key: 'x', label: 'X (Twitter)', description: 'Draft + post tweets via the v2 API.', Icon: XIcon },
  { key: 'github', label: 'GitHub', description: 'Read pull requests + issues.', Icon: GithubIcon },
  { key: 'slack', label: 'Slack', description: 'Post messages to channels.', Icon: SlackIcon },
  { key: 'vercel', label: 'Vercel', description: 'Trigger builds + deploys.', Icon: VercelIcon },
  { key: 'vscode', label: 'VS Code', description: 'Open projects in the editor.', Icon: VSCodeIcon },
];

/**
 * Settings panel. Sectioned layout:
 *   - Appearance (accent color + reduce motion)
 *   - Behavior (global hotkey + launch on startup)
 *   - Integrations (per-service enable toggles)
 *   - About / Reset
 *
 * Persisted to localStorage by the store.
 */
export function SettingsView({ onExit }: SettingsViewProps) {
  const { settings, updateSettings, toggleIntegration, resetSettings } = useGlideStore();

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex h-full flex-col"
    >
      <header className="glide-no-drag mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CogIcon className="h-3.5 w-3.5 text-mint-400" />
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink-100">
            Settings
          </h2>
        </div>
        <button
          onClick={onExit}
          className="rounded border border-ink-700 bg-ink-850 px-2 py-0.5 font-mono text-[10px] tracking-wide text-ink-300 hover:border-ink-600 hover:text-ink-100"
        >
          ESC
        </button>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1" data-selectable>
        {/* ---------- Appearance ---------- */}
        <Section title="Appearance">
          <Row label="Accent color" hint="Used for focus rings and active states.">
            <div className="flex gap-2">
              {ACCENT_SWATCHES.map((sw) => {
                const active = settings.accent === sw.id;
                return (
                  <button
                    key={sw.id}
                    onClick={() => updateSettings({ accent: sw.id })}
                    aria-label={sw.label}
                    className={`relative h-7 w-7 rounded border transition-colors ${
                      active
                        ? 'border-mint-400 shadow-[0_0_0_1px_rgba(31,227,154,0.45)]'
                        : 'border-ink-700 hover:border-ink-500'
                    }`}
                    style={{ backgroundColor: sw.hex }}
                  >
                    {active && (
                      <CheckIcon className="absolute inset-0 m-auto h-4 w-4 text-ink-900" />
                    )}
                  </button>
                );
              })}
            </div>
          </Row>

          <Row label="Reduce motion" hint="Skips spring/stagger animations.">
            <Toggle
              checked={settings.reduceMotion}
              onChange={(v) => updateSettings({ reduceMotion: v })}
            />
          </Row>
        </Section>

        {/* ---------- Behavior ---------- */}
        <Section title="Behavior">
          <Row label="Global hotkey" hint="Press to toggle the palette from anywhere.">
            <input
              value={settings.hotkey}
              onChange={(e) => updateSettings({ hotkey: e.target.value })}
              spellCheck={false}
              className="w-32 rounded border border-ink-700 bg-ink-900 px-2 py-1 text-right font-mono text-[11px] text-ink-100 outline-none focus:border-mint-500"
            />
          </Row>
          <Row label="Launch on startup" hint="Start Glide when Windows boots.">
            <Toggle
              checked={settings.launchOnStartup}
              onChange={(v) => updateSettings({ launchOnStartup: v })}
            />
          </Row>
        </Section>

        {/* ---------- Integrations ---------- */}
        <Section title="Integrations">
          <ul className="flex flex-col gap-1.5">
            {INTEGRATIONS.map((it) => {
              const on = settings.integrations[it.key];
              return (
                <li
                  key={it.key}
                  className="flex items-center gap-3 rounded border border-ink-700 bg-ink-850 px-3 py-2"
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${
                      on ? 'bg-mint-500/15 text-mint-300' : 'bg-ink-800 text-ink-400'
                    }`}
                  >
                    <it.Icon className="h-[14px] w-[14px]" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[12.5px] font-medium text-ink-100">
                      {it.label}
                    </span>
                    <span className="text-[11px] text-ink-400">{it.description}</span>
                  </div>
                  <Toggle checked={on} onChange={() => toggleIntegration(it.key)} />
                </li>
              );
            })}
          </ul>
        </Section>

        {/* ---------- About ---------- */}
        <Section title="About">
          <div className="flex items-center justify-between rounded border border-ink-700 bg-ink-850 px-3 py-2 text-[12px] text-ink-300">
            <div className="flex flex-col">
              <span className="font-medium text-ink-100">Glide</span>
              <span className="text-[11px] text-ink-400">v0.1.0 · MIT License</span>
            </div>
            <button
              onClick={() => {
                if (confirm('Reset all settings to defaults?')) resetSettings();
              }}
              className="rounded border border-ink-700 bg-ink-900 px-2.5 py-1 text-[11px] font-medium text-ink-200 hover:border-red-500/50 hover:text-red-200"
            >
              Reset to defaults
            </button>
          </div>
        </Section>
      </div>
    </motion.div>
  );
}

/* ---------------- Local primitives ---------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
        {title}
      </h3>
      <div className="flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded border border-ink-700 bg-ink-850 px-3 py-2">
      <div className="flex min-w-0 flex-col">
        <span className="text-[12.5px] font-medium text-ink-100">{label}</span>
        {hint && <span className="text-[11px] text-ink-400">{hint}</span>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange(v: boolean): void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full border transition-colors ${
        checked
          ? 'border-mint-500/60 bg-mint-500/30'
          : 'border-ink-700 bg-ink-900'
      }`}
    >
      <span
        className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-all ${
          checked ? 'left-[18px] bg-mint-300' : 'left-[2px] bg-ink-400'
        }`}
      />
    </button>
  );
}
