import { AnimatePresence } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { Shell } from './components/Shell';
import { CommandInput } from './components/CommandInput';
import { ResultList } from './components/ResultList';
import { QuickActionsSidebar } from './components/QuickActionsSidebar';
import { StatusBar } from './components/StatusBar';
import { ChatView } from './components/ChatView';
import { SettingsView } from './components/SettingsView';
import { ToolResultPanel } from './components/ToolResultPanel';
import { useGlideStore } from './store/useGlideStore';
import { filterCommands } from './lib/commands';
import { mcpToolsToCommands } from './lib/mcpCommands';
import type { CommandEntry, QuickAction } from './lib/types';
import type { SystemStatus } from '../shared/ipc';

export function App() {
  const {
    query,
    selectedIndex,
    moveSelection,
    setSelectedIndex,
    view,
    setView,
    setStatus,
    setLastResult,
    lastResult,
    mcpTools,
    setMcpServers,
    setMcpTools,
    setLlmConfigs,
  } = useGlideStore();

  /* ----- Merge static + MCP commands ----- */
  const results = useMemo<CommandEntry[]>(() => {
    const staticResults = filterCommands(query);
    const mcpResults = mcpToolsToCommands(mcpTools).filter((c) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return `${c.label} ${c.description ?? ''} ${(c.keywords ?? []).join(' ')}`
        .toLowerCase()
        .includes(q);
    });
    return [...staticResults, ...mcpResults];
  }, [query, mcpTools]);

  /* ----- run-action plumbing ----- */
  async function runEntry(entry: CommandEntry) {
    try {
      const res = await entry.run();
      setLastResult(res);
    } catch (err) {
      setLastResult({
        ok: false,
        message: err instanceof Error ? err.message : String(err),
        at: new Date().toISOString(),
      });
    }
  }

  /* ----- quick actions (right rail) ----- */
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 'create-workflow',
        label: 'Create Workflow',
        run: async () => {
          setView('chat');
          useGlideStore.getState().appendMessage({
            role: 'system',
            content: 'Starting a new workflow. Describe what should happen, step by step.',
          });
        },
      },
      {
        id: 'run-staging-deploy',
        label: "Run 'Staging Deploy'",
        run: () =>
          window.glide.actions.deployVercel({ project: 'glide-web', env: 'preview' }),
      },
      {
        id: 'ai-chat-history',
        label: 'AI Chat History',
        run: async () => setView('chat'),
      },
    ],
    [setView],
  );

  /* ----- MCP: load on mount + subscribe to push events ----- */
  useEffect(() => {
    // Initial load
    window.glide.mcp.listServers().then(setMcpServers).catch(() => {});
    window.glide.mcp.listTools().then(setMcpTools).catch(() => {});

    // Subscribe to push events from main
    const unsubServers = window.glide.mcp.onServersChanged(setMcpServers);
    const unsubTools = window.glide.mcp.onToolsChanged(setMcpTools);

    return () => {
      unsubServers();
      unsubTools();
    };
  }, [setMcpServers, setMcpTools]);

  /* ----- LLM: load saved configs on mount ----- */
  useEffect(() => {
    window.glide.llm.getConfigs().then(setLlmConfigs).catch(() => {});
  }, [setLlmConfigs]);

  /* ----- global key handling ----- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (view !== 'palette') setView('palette');
        return;
      }
      if (view !== 'palette') return;

      if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1, results.length); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); moveSelection(-1, results.length); return; }

      if (e.metaKey || e.ctrlKey) {
        const map: Record<string, string> = {
          d: 'tweet-glidehq', e: 'open-nexus-crm',
          v: 'vercel-deploy',  p: 'sync-prs', l: 'x-limits',
        };
        const id = map[e.key.toLowerCase()];
        if (id) {
          const entry = results.find((r) => r.id === id);
          if (entry) { e.preventDefault(); runEntry(entry); }
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, view]);

  /* ----- system status subscription ----- */
  useEffect(() => {
    return window.glide.status.onUpdate((s: SystemStatus) => setStatus(s));
  }, [setStatus]);

  /* ----- auto-clear toast ----- */
  useEffect(() => {
    if (!lastResult) return;
    const t = setTimeout(() => setLastResult(null), 4200);
    return () => clearTimeout(t);
  }, [lastResult, setLastResult]);

  /* ----- keep selection inside bounds when results shrink ----- */
  useEffect(() => {
    if (selectedIndex >= results.length) {
      setSelectedIndex(Math.max(0, results.length - 1));
    }
  }, [results.length, selectedIndex, setSelectedIndex]);

  return (
    <Shell>
      <main className="flex flex-1 gap-4 overflow-hidden px-4 pb-3 pt-4">
        <section className="flex min-w-0 flex-1 flex-col gap-3">
          <AnimatePresence mode="wait">
            {view === 'palette' && (
              <div key="palette" className="flex flex-1 flex-col gap-3 overflow-hidden">
                <CommandInput
                  onSubmit={() => { const e = results[selectedIndex]; if (e) runEntry(e); }}
                  onEnterChat={() => setView('chat')}
                />
                <ResultList results={results} onRun={runEntry} />
              </div>
            )}
            {view === 'chat' && (
              <ChatView key="chat" onExit={() => setView('palette')} />
            )}
            {view === 'settings' && (
              <SettingsView key="settings" onExit={() => setView('palette')} />
            )}
          </AnimatePresence>
        </section>

        {view === 'palette' && (
          <QuickActionsSidebar actions={quickActions} onAction={(a) => { a.run(); }} />
        )}
      </main>

      {/* MCP tool result panel (rich) */}
      <ToolResultPanel />

      {/* Simple toast for non-MCP action results */}
      <AnimatePresence>
        {lastResult && !('content' in ((lastResult.data as object | undefined) ?? {})) && (
          <div
            className={`pointer-events-none absolute bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-md border px-4 py-2 text-[12px] shadow-lg ${
              lastResult.ok
                ? 'border-mint-400/45 bg-ink-850 text-mint-100'
                : 'border-red-500/50 bg-ink-850 text-red-200'
            }`}
          >
            {lastResult.message}
          </div>
        )}
      </AnimatePresence>

      <StatusBar />
    </Shell>
  );
}
