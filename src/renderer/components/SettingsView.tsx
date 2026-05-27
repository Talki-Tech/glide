import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
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
  CloseIcon,
  SparkleIcon,
  TerminalIcon,
  SearchIcon,
} from './icons';
import type { ComponentType, SVGProps } from 'react';
import type { McpServerConfig } from '../../shared/ipc';
import { MCP_CATALOG, CATALOG_CATEGORIES, type CatalogEntry } from '../lib/mcpCatalog';
import {
  LLM_MODELS,
  type LlmProvider,
  type LlmProviderConfigs,
} from '../../shared/llm';

interface SettingsViewProps {
  onExit(): void;
}

/* ------------------------------------------------------------------ */
/* Appearance / Behavior constants                                     */
/* ------------------------------------------------------------------ */

interface AccentSwatch {
  id: AccentColor;
  label: string;
  hex: string;
}

const ACCENT_SWATCHES: AccentSwatch[] = [
  { id: 'mint',   label: 'Mint',   hex: '#1FE39A' },
  { id: 'cyan',   label: 'Cyan',   hex: '#22D3EE' },
  { id: 'violet', label: 'Violet', hex: '#A78BFA' },
  { id: 'amber',  label: 'Amber',  hex: '#F59E0B' },
];

interface IntegrationRow {
  key: keyof GlideSettings['integrations'];
  label: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const INTEGRATIONS: IntegrationRow[] = [
  { key: 'x',       label: 'X (Twitter)', description: 'Draft + post tweets via the v2 API.',   Icon: XIcon      },
  { key: 'github',  label: 'GitHub',      description: 'Read pull requests + issues.',           Icon: GithubIcon },
  { key: 'slack',   label: 'Slack',       description: 'Post messages to channels.',             Icon: SlackIcon  },
  { key: 'vercel',  label: 'Vercel',      description: 'Trigger builds + deploys.',              Icon: VercelIcon },
  { key: 'vscode',  label: 'VS Code',     description: 'Open projects in the editor.',           Icon: VSCodeIcon },
];

type SettingsTab = 'appearance' | 'behavior' | 'integrations' | 'mcp' | 'ai' | 'about';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'appearance',   label: 'Appearance' },
  { id: 'behavior',     label: 'Behavior' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'mcp',          label: 'MCP Servers' },
  { id: 'ai',           label: 'AI Providers' },
  { id: 'about',        label: 'About' },
];

/* ------------------------------------------------------------------ */
/* Root component                                                       */
/* ------------------------------------------------------------------ */

export function SettingsView({ onExit }: SettingsViewProps) {
  const { settings, updateSettings, toggleIntegration, resetSettings } = useGlideStore();
  const [tab, setTab] = useState<SettingsTab>('appearance');

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex h-full flex-col"
    >
      {/* Header */}
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

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Tab sidebar */}
        <nav className="flex w-36 shrink-0 flex-col gap-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded px-3 py-1.5 text-left text-[12px] font-medium transition-colors ${
                tab === t.id
                  ? 'bg-ink-800 text-mint-200'
                  : 'text-ink-300 hover:bg-ink-850 hover:text-ink-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1" data-selectable>
          {tab === 'appearance' && (
            <>
              <Section title="Accent color">
                <Row label="Color" hint="Used for focus rings and active states.">
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
                          {active && <CheckIcon className="absolute inset-0 m-auto h-4 w-4 text-ink-900" />}
                        </button>
                      );
                    })}
                  </div>
                </Row>
              </Section>
              <Section title="Motion">
                <Row label="Reduce motion" hint="Skips spring/stagger animations.">
                  <Toggle checked={settings.reduceMotion} onChange={(v) => updateSettings({ reduceMotion: v })} />
                </Row>
              </Section>
            </>
          )}

          {tab === 'behavior' && (
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
                <Toggle checked={settings.launchOnStartup} onChange={(v) => updateSettings({ launchOnStartup: v })} />
              </Row>
            </Section>
          )}

          {tab === 'integrations' && (
            <Section title="Integrations">
              <ul className="flex flex-col gap-1.5">
                {INTEGRATIONS.map((it) => {
                  const on = settings.integrations[it.key];
                  return (
                    <li key={it.key} className="flex items-center gap-3 rounded border border-ink-700 bg-ink-850 px-3 py-2">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded ${on ? 'bg-mint-500/15 text-mint-300' : 'bg-ink-800 text-ink-400'}`}>
                        <it.Icon className="h-[14px] w-[14px]" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="text-[12.5px] font-medium text-ink-100">{it.label}</span>
                        <span className="text-[11px] text-ink-400">{it.description}</span>
                      </div>
                      <Toggle checked={on} onChange={() => toggleIntegration(it.key)} />
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {tab === 'mcp' && <McpTab />}

          {tab === 'ai' && <AiTab />}

          {tab === 'about' && (
            <Section title="About">
              <div className="flex items-center justify-between rounded border border-ink-700 bg-ink-850 px-3 py-2 text-[12px] text-ink-300">
                <div className="flex flex-col">
                  <span className="font-medium text-ink-100">Glide</span>
                  <span className="text-[11px] text-ink-400">v0.1.0 · MIT License · Talki Tech</span>
                </div>
                <button
                  onClick={() => { if (confirm('Reset all settings to defaults?')) resetSettings(); }}
                  className="rounded border border-ink-700 bg-ink-900 px-2.5 py-1 text-[11px] font-medium text-ink-200 hover:border-red-500/50 hover:text-red-200"
                >
                  Reset to defaults
                </button>
              </div>
            </Section>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* AI Providers tab                                                    */
/* ------------------------------------------------------------------ */

const PROVIDER_META: { id: LlmProvider; label: string; docsUrl: string; keyPlaceholder: string }[] = [
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    docsUrl: 'https://console.anthropic.com/keys',
    keyPlaceholder: 'sk-ant-...',
  },
  {
    id: 'openai',
    label: 'OpenAI (GPT)',
    docsUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-...',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIza...',
  },
];

const MASKED = '••••••••';

function AiTab() {
  const { llmConfigs, setLlmConfigs } = useGlideStore();

  // Local draft — apiKey '' means unchanged (keep stored key), non-empty = new key
  const [draft, setDraft] = useState<LlmProviderConfigs>(() => {
    const init: LlmProviderConfigs = {};
    for (const p of PROVIDER_META) {
      // Don't pre-fill masked key into input — keep field empty, show placeholder
      init[p.id] = { apiKey: '', defaultModel: llmConfigs[p.id]?.defaultModel ?? LLM_MODELS[p.id][0].id };
    }
    return init;
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Whether a key is already stored for this provider (masked value from main)
  function hasStoredKey(provider: LlmProvider): boolean {
    return llmConfigs[provider]?.apiKey === MASKED;
  }

  function setKey(provider: LlmProvider, key: string) {
    setDraft((d) => ({ ...d, [provider]: { ...d[provider], apiKey: key } }));
    setSaved(false);
  }

  function setModel(provider: LlmProvider, model: string) {
    setDraft((d) => ({ ...d, [provider]: { ...d[provider], defaultModel: model } }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Build payload: for providers where user left key blank, keep stored key
      // (main process will ignore empty-string keys and keep existing)
      const toSend: LlmProviderConfigs = {};
      for (const p of PROVIDER_META) {
        const newKey = draft[p.id]?.apiKey?.trim() ?? '';
        const storedMasked = llmConfigs[p.id]?.apiKey === MASKED;
        toSend[p.id] = {
          // If blank + already have stored key → send sentinel to keep it
          // If blank + no stored key → empty (no key)
          // If non-blank → new key
          apiKey: newKey || (storedMasked ? '__KEEP__' : ''),
          defaultModel: draft[p.id]?.defaultModel ?? LLM_MODELS[p.id][0].id,
        };
      }
      await window.glide.llm.setConfigs(toSend);
      // Refresh masked status from main
      const updated = await window.glide.llm.getConfigs();
      setLlmConfigs(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Section title="AI provider keys">
        <div className="flex flex-col gap-2">
          {PROVIDER_META.map((pm) => {
            const cfg = draft[pm.id];
            const stored = hasStoredKey(pm.id);
            const hasKey = stored || !!cfg?.apiKey;
            return (
              <div key={pm.id} className="flex flex-col gap-1.5 rounded border border-ink-700 bg-ink-850 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-semibold text-ink-100">{pm.label}</span>
                  {hasKey && (
                    <span className="rounded bg-mint-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-mint-300">
                      Key set
                    </span>
                  )}
                </div>

                {/* API key */}
                <FormRow label="API Key">
                  <input
                    type="password"
                    value={cfg?.apiKey ?? ''}
                    onChange={(e) => setKey(pm.id, e.target.value)}
                    placeholder={stored ? 'Key saved — paste new to replace' : pm.keyPlaceholder}
                    spellCheck={false}
                    className="w-full rounded border border-ink-700 bg-ink-900 px-2 py-1 font-mono text-[11px] text-ink-100 outline-none focus:border-mint-500 placeholder:text-ink-500"
                  />
                </FormRow>

                {/* Default model selector */}
                <FormRow label="Default model">
                  <select
                    value={cfg?.defaultModel ?? LLM_MODELS[pm.id][0].id}
                    onChange={(e) => setModel(pm.id, e.target.value)}
                    className="w-full rounded border border-ink-700 bg-ink-900 px-2 py-1 text-[11px] text-ink-100 outline-none focus:border-mint-500"
                  >
                    {LLM_MODELS[pm.id].map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}{m.note ? ` · ${m.note}` : ''}{` · ${(m.contextWindow / 1000).toFixed(0)}k ctx`}
                      </option>
                    ))}
                  </select>
                </FormRow>

                <a
                  href={pm.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-mint-400/70 hover:text-mint-300 hover:underline"
                >
                  Get API key →
                </a>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded border border-mint-500/60 bg-mint-500/15 px-4 py-1.5 text-[12px] font-medium text-mint-100 disabled:opacity-50 hover:enabled:bg-mint-500/25"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-[11px] text-mint-300">
            <CheckIcon className="h-3.5 w-3.5" /> Saved
          </span>
        )}
      </div>

      <p className="text-[10px] text-ink-500">
        Keys sent to main process only — never leave your machine.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MCP tab                                                             */
/* ------------------------------------------------------------------ */

const STATUS_COLOR: Record<string, string> = {
  connected:    'text-mint-300',
  connecting:   'text-amber-300',
  error:        'text-red-300',
  disconnected: 'text-ink-400',
};

const STATUS_DOT: Record<string, string> = {
  connected:    'bg-mint-400',
  connecting:   'bg-amber-400 animate-pulse',
  error:        'bg-red-400',
  disconnected: 'bg-ink-500',
};

type AddMode = 'catalog' | 'json' | 'catalog-entry';

function McpTab() {
  const { mcpServers } = useGlideStore();
  const [addMode, setAddMode] = useState<AddMode | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CatalogEntry | null>(null);
  const [catSearch, setCatSearch] = useState('');
  const [catCategory, setCatCategory] = useState<string>('all');

  const filteredCatalog = useMemo(() => {
    return MCP_CATALOG.filter((e) => {
      const matchCat = catCategory === 'all' || e.category === catCategory;
      const q = catSearch.trim().toLowerCase();
      const matchQ = !q || `${e.name} ${e.description} ${e.package}`.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [catSearch, catCategory]);

  async function handleRemove(name: string) {
    if (!confirm(`Remove server "${name}"?`)) return;
    await window.glide.mcp.removeServer(name).catch(() => {});
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ---- Server list ---- */}
      <Section title="Connected servers">
        {mcpServers.length === 0 ? (
          <p className="rounded border border-ink-700 bg-ink-850 px-3 py-3 text-[12px] text-ink-400">
            No servers configured yet. Add one below.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {mcpServers.map((srv) => (
              <li key={srv.name} className="flex items-start gap-3 rounded border border-ink-700 bg-ink-850 px-3 py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-ink-800 text-ink-300">
                  {srv.transport === 'http' ? <SparkleIcon className="h-[14px] w-[14px]" /> : <TerminalIcon className="h-[14px] w-[14px]" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[12.5px] font-medium text-ink-100">{srv.name}</span>
                  <span className="truncate font-mono text-[10px] text-ink-400">
                    {srv.transport === 'stdio' ? `${srv.command ?? ''} ${(srv.args ?? []).join(' ')}` : srv.url}
                  </span>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[srv.status] ?? 'bg-ink-500'}`} />
                    <span className={`text-[10px] ${STATUS_COLOR[srv.status] ?? 'text-ink-400'}`}>
                      {srv.status}
                      {srv.status === 'connected' && ` · ${srv.toolCount} tools`}
                      {srv.error ? ` · ${srv.error}` : ''}
                    </span>
                  </div>
                </div>
                <button onClick={() => handleRemove(srv.name)} className="mt-0.5 rounded p-1 text-ink-400 hover:bg-ink-800 hover:text-red-300" aria-label="Remove">
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* ---- Add buttons ---- */}
      {addMode === null && (
        <div className="flex gap-2">
          <button onClick={() => setAddMode('catalog')} className="rounded border border-ink-700 bg-ink-850 px-3 py-1.5 text-[12px] font-medium text-ink-200 hover:border-mint-500/60 hover:text-mint-200">
            + Browse catalog
          </button>
          <button onClick={() => setAddMode('json')} className="rounded border border-ink-700 bg-ink-850 px-3 py-1.5 text-[12px] font-medium text-ink-200 hover:border-mint-500/60 hover:text-mint-200">
            + Paste JSON
          </button>
        </div>
      )}

      {/* ---- Catalog ---- */}
      {addMode === 'catalog' && selectedEntry === null && (
        <Section title="Browse MCP servers">
          {/* Search + category filter */}
          <div className="flex gap-2">
            <div className="flex flex-1 items-center gap-2 rounded border border-ink-700 bg-ink-850 px-2 py-1">
              <SearchIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" />
              <input
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder="Search servers…"
                className="w-full bg-transparent font-mono text-[11px] text-ink-100 outline-none placeholder:text-ink-400"
                autoFocus
              />
            </div>
            <button onClick={() => { setAddMode(null); setCatSearch(''); }} className="rounded border border-ink-700 bg-ink-850 px-2 py-1 text-[11px] text-ink-300 hover:border-ink-600">
              Cancel
            </button>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            {CATALOG_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatCategory(c.id)}
                className={`rounded border px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  catCategory === c.id
                    ? 'border-mint-500/60 bg-mint-500/15 text-mint-200'
                    : 'border-ink-700 bg-ink-850 text-ink-300 hover:border-ink-600'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {filteredCatalog.map((entry) => {
              const installed = mcpServers.some((s) => s.name === entry.id);
              return (
                <button
                  key={entry.id}
                  onClick={() => { setSelectedEntry(entry); setAddMode('catalog-entry'); }}
                  disabled={installed}
                  className={`flex flex-col gap-0.5 rounded border px-3 py-2 text-left transition-colors disabled:opacity-40 ${
                    installed
                      ? 'border-mint-500/30 bg-mint-500/5'
                      : 'border-ink-700 bg-ink-850 hover:border-mint-500/60 hover:bg-ink-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-ink-100">{entry.name}</span>
                    {installed && <span className="text-[9px] font-semibold uppercase tracking-wide text-mint-400">Added</span>}
                  </div>
                  <span className="line-clamp-2 text-[10.5px] text-ink-400">{entry.description}</span>
                  <span className="mt-0.5 font-mono text-[9.5px] text-ink-500">{entry.package}</span>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* ---- Catalog entry — tokens + confirm ---- */}
      {addMode === 'catalog-entry' && selectedEntry !== null && (
        <CatalogEntryForm
          entry={selectedEntry}
          onBack={() => { setSelectedEntry(null); setAddMode('catalog'); }}
          onDone={() => { setSelectedEntry(null); setAddMode(null); }}
        />
      )}

      {/* ---- JSON paste ---- */}
      {addMode === 'json' && (
        <JsonPasteForm
          onDone={() => setAddMode(null)}
          onCancel={() => setAddMode(null)}
        />
      )}

      <p className="text-[10px] text-ink-500">
        Config: <span className="font-mono">~/.glide/servers.json</span> · Compatible with Claude Desktop format.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Catalog entry form — fill tokens, then connect                      */
/* ------------------------------------------------------------------ */

function CatalogEntryForm({
  entry,
  onBack,
  onDone,
}: {
  entry: CatalogEntry;
  onBack(): void;
  onDone(): void;
}) {
  const [tokens, setTokens] = useState<Record<string, string>>(
    Object.fromEntries((entry.requiredTokens ?? []).map((t) => [t.key, ''])),
  );
  // Configurable args keyed by index
  const [argValues, setArgValues] = useState<Record<number, string>>(
    Object.fromEntries((entry.configurableArgs ?? []).map((a) => [a.index, ''])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  /** Splice user-provided values into the template args array */
  function buildArgs(): string[] {
    const base = [...(entry.template.args ?? [])];
    for (const ca of entry.configurableArgs ?? []) {
      const val = argValues[ca.index];
      if (val && val.trim()) base[ca.index] = val.trim();
    }
    return base;
  }

  const previewArgs = buildArgs();

  async function handleAdd() {
    setError('');
    const env = { ...(entry.template.env ?? {}), ...tokens };
    const config: McpServerConfig = {
      name: entry.id,
      transport: entry.template.transport,
      command: entry.template.command,
      args: buildArgs(),
      url: entry.template.url,
      env,
    };
    setSaving(true);
    try {
      await window.glide.mcp.addServer(config);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title={`Add · ${entry.name}`}>
      <div className="flex flex-col gap-2 rounded border border-ink-700 bg-ink-850 p-3">
        <p className="text-[11.5px] text-ink-300">{entry.description}</p>

        {/* Configurable args */}
        {(entry.configurableArgs ?? []).map((ca) => (
          <FormRow key={ca.index} label={ca.label}>
            <input
              value={argValues[ca.index] ?? ''}
              onChange={(e) => setArgValues((v) => ({ ...v, [ca.index]: e.target.value }))}
              placeholder={ca.placeholder}
              type="text"
              spellCheck={false}
              className="w-full rounded border border-ink-700 bg-ink-900 px-2 py-1 font-mono text-[11px] text-ink-100 outline-none focus:border-mint-500"
            />
          </FormRow>
        ))}

        {/* Command preview (live) */}
        <div className="rounded bg-ink-900 px-3 py-2">
          <p className="font-mono text-[10px] text-ink-400 break-all">
            {entry.template.command} {previewArgs.join(' ')}
          </p>
        </div>

        {/* Token fields */}
        {(entry.requiredTokens ?? []).map((tok) => (
          <FormRow key={tok.key} label={tok.label}>
            <input
              value={tokens[tok.key] ?? ''}
              onChange={(e) => setTokens((t) => ({ ...t, [tok.key]: e.target.value }))}
              placeholder={tok.placeholder}
              type="password"
              className="w-full rounded border border-ink-700 bg-ink-900 px-2 py-1 font-mono text-[11px] text-ink-100 outline-none focus:border-mint-500"
            />
          </FormRow>
        ))}

        {entry.docsUrl && (
          <a href={entry.docsUrl} target="_blank" rel="noreferrer" className="text-[10.5px] text-mint-400/80 hover:text-mint-300 hover:underline">
            {entry.docsUrl}
          </a>
        )}

        {error && <p className="text-[11px] text-red-300">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={handleAdd} disabled={saving} className="rounded border border-mint-500/60 bg-mint-500/15 px-3 py-1.5 text-[12px] font-medium text-mint-100 disabled:opacity-50 hover:enabled:bg-mint-500/25">
            {saving ? 'Connecting…' : 'Add server'}
          </button>
          <button onClick={onBack} className="rounded border border-ink-700 bg-ink-900 px-3 py-1.5 text-[12px] font-medium text-ink-200 hover:border-ink-600">
            ← Back
          </button>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* JSON paste form — Claude Desktop style                               */
/* ------------------------------------------------------------------ */

const JSON_PLACEHOLDER = `{
  "my-server": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\\\Users"],
    "env": {}
  }
}`;

function JsonPasteForm({ onDone, onCancel }: { onDone(): void; onCancel(): void }) {
  const [raw, setRaw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      setError('Invalid JSON. Check syntax.');
      return;
    }

    // Accept both { "name": {...} } and Claude Desktop's { "mcpServers": { "name": {...} } }
    const entries =
      parsed['mcpServers'] && typeof parsed['mcpServers'] === 'object'
        ? Object.entries(parsed['mcpServers'] as Record<string, unknown>)
        : Object.entries(parsed);

    if (entries.length === 0) { setError('No server entries found.'); return; }

    setSaving(true);
    try {
      for (const [name, conf] of entries) {
        const c = conf as Record<string, unknown>;
        const config: McpServerConfig = {
          name,
          transport: (c['url'] ? 'http' : 'stdio') as 'stdio' | 'http',
          command: c['command'] as string | undefined,
          args: c['args'] as string[] | undefined,
          env: c['env'] as Record<string, string> | undefined,
          url: c['url'] as string | undefined,
        };
        await window.glide.mcp.addServer(config);
      }
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section title="Paste JSON config">
      <div className="flex flex-col gap-2 rounded border border-ink-700 bg-ink-850 p-3">
        <p className="text-[11px] text-ink-400">
          Paste a Claude Desktop–compatible block. Supports single server or <span className="font-mono">mcpServers</span> object with multiple entries.
        </p>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={JSON_PLACEHOLDER}
          rows={10}
          spellCheck={false}
          autoFocus
          className="w-full resize-none rounded border border-ink-700 bg-ink-900 p-2 font-mono text-[11px] text-ink-100 outline-none focus:border-mint-500"
        />
        {error && <p className="text-[11px] text-red-300">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving || !raw.trim()} className="rounded border border-mint-500/60 bg-mint-500/15 px-3 py-1.5 text-[12px] font-medium text-mint-100 disabled:opacity-50 hover:enabled:bg-mint-500/25">
            {saving ? 'Connecting…' : 'Add server(s)'}
          </button>
          <button onClick={onCancel} className="rounded border border-ink-700 bg-ink-900 px-3 py-1.5 text-[12px] font-medium text-ink-200 hover:border-ink-600">
            Cancel
          </button>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Shared layout primitives                                            */
/* ------------------------------------------------------------------ */

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

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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

function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-ink-300">
        {label}
        {hint && <span className="ml-1 text-ink-500">({hint})</span>}
      </span>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange(v: boolean): void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full border transition-colors ${
        checked ? 'border-mint-500/60 bg-mint-500/30' : 'border-ink-700 bg-ink-900'
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
