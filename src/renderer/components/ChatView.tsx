import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useGlideStore } from '../store/useGlideStore';
import { SparkleIcon, TerminalIcon } from './icons';
import { LLM_MODELS, type LlmProvider } from '../../shared/llm';
import type { ChatToolCallEvent } from '../../shared/ipc';
import { ChatMessageContent } from './ChatMessage';

interface ChatViewProps {
  onExit(): void;
}

const PROVIDER_LABEL: Record<LlmProvider, string> = {
  anthropic: 'Claude',
  openai: 'GPT',
  gemini: 'Gemini',
};

type MessageRole = 'user' | 'assistant' | 'system';

interface DisplayMessage {
  id: string;
  role: MessageRole;
  content: string;
  streaming?: boolean;
  toolCalls?: ChatToolCallEvent[];
  /** Tool result injected for LLM context — hidden from user */
  isToolResult?: boolean;
}

function isToolResultContent(content: string): boolean {
  return content.startsWith('[Tool result for ');
}

let msgCounter = 0;
function nextId() { return `msg-${++msgCounter}`; }

export function ChatView({ onExit }: ChatViewProps) {
  const { appendMessage, isAssistantTyping, setAssistantTyping, llmConfigs } = useGlideStore();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const streamingIdRef = useRef<string | null>(null);

  // Resolve active provider label
  const activeLlmLabel = (() => {
    const order: LlmProvider[] = ['anthropic', 'openai', 'gemini'];
    for (const p of order) {
      const cfg = llmConfigs[p];
      if (cfg?.apiKey) {
        const modelId = cfg.defaultModel ?? LLM_MODELS[p][0].id;
        const model = LLM_MODELS[p].find((m) => m.id === modelId);
        return `${PROVIDER_LABEL[p]} · ${model?.name ?? modelId}`;
      }
    }
    return null;
  })();

  // Load persisted history on mount
  useEffect(() => {
    window.glide.chatHistory.load().then((history) => {
      if (history.length > 0) {
        setMessages(
          history
            .filter((m) => m.role !== 'system')
            .map((m) => ({
              id: nextId(),
              role: m.role as MessageRole,
              content: m.content,
              isToolResult: m.role === 'user' && isToolResultContent(m.content),
            })),
        );
      }
    }).catch(() => {});
  }, []);

  // Subscribe to streaming events
  useEffect(() => {
    const unToken = window.glide.chatStream.onToken(({ delta }) => {
      setMessages((prev) => {
        const id = streamingIdRef.current;
        if (!id) return prev;
        return prev.map((m) =>
          m.id === id ? { ...m, content: m.content + delta } : m,
        );
      });
    });

    const unToolCall = window.glide.chatStream.onToolCall((evt) => {
      setMessages((prev) => {
        const id = streamingIdRef.current;
        if (!id) return prev;
        return prev.map((m) => {
          if (m.id !== id) return m;
          const existing = m.toolCalls ?? [];
          // Update existing entry if same toolName+no result yet, else add
          const idx = existing.findIndex((tc) => tc.toolName === evt.toolName && !tc.result);
          if (idx >= 0 && evt.result) {
            const updated = [...existing];
            updated[idx] = { ...updated[idx], result: evt.result };
            return { ...m, toolCalls: updated };
          }
          if (idx < 0 && !evt.result) {
            return { ...m, toolCalls: [...existing, evt] };
          }
          return m;
        });
      });
    });

    const unDone = window.glide.chatStream.onDone(() => {
      setMessages((prev) => {
        const id = streamingIdRef.current;
        if (!id) return prev;
        return prev.map((m) => m.id === id ? { ...m, streaming: false } : m);
      });
      streamingIdRef.current = null;
      setAssistantTyping(false);
    });

    const unError = window.glide.chatStream.onError(({ error }) => {
      setMessages((prev) => {
        const id = streamingIdRef.current;
        if (id) {
          const updated = prev.map((m) =>
            m.id === id ? { ...m, content: `Error: ${error}`, streaming: false } : m,
          );
          streamingIdRef.current = null;
          return updated;
        }
        return [...prev, { id: nextId(), role: 'assistant' as MessageRole, content: `Error: ${error}` }];
      });
      setAssistantTyping(false);
    });

    return () => { unToken(); unToolCall(); unDone(); unError(); };
  }, [setAssistantTyping]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isAssistantTyping]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = useCallback(async () => {
    const text = draft.trim();
    if (!text || isAssistantTyping) return;
    setDraft('');

    const userMsg: DisplayMessage = { id: nextId(), role: 'user', content: text };
    const assistantId = nextId();
    const assistantMsg: DisplayMessage = { id: assistantId, role: 'assistant', content: '', streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    streamingIdRef.current = assistantId;
    setAssistantTyping(true);

    // Build messages array for main process (use current display messages as history)
    const history = [...messages, userMsg]
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      await window.glide.chat.send({ messages: history });
      // Streaming fills the bubble via onToken events.
      // chat.send() return value is ignored — content already streamed.
      // onDone handler marks streaming:false. Nothing to do here.
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${err instanceof Error ? err.message : 'unknown'}`, streaming: false }
            : m,
        ),
      );
    } finally {
      if (streamingIdRef.current === assistantId) {
        streamingIdRef.current = null;
        setAssistantTyping(false);
      }
    }
  }, [draft, isAssistantTyping, messages, appendMessage, setAssistantTyping]);

  async function handleClearHistory() {
    if (!confirm('Clear chat history?')) return;
    await window.glide.chatHistory.clear().catch(() => {});
    setMessages([]);
    streamingIdRef.current = null;
    setAssistantTyping(false);
  }

  return (
    <motion.div
      key="chat"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex h-full flex-col"
    >
      <header className="glide-no-drag mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparkleIcon className="h-3.5 w-3.5 text-mint-400" />
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink-100">Chat</h2>
          {activeLlmLabel && (
            <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-ink-400">
              {activeLlmLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="rounded border border-ink-700 bg-ink-850 px-2 py-0.5 font-mono text-[10px] text-ink-400 hover:border-red-500/50 hover:text-red-300"
            >
              Clear
            </button>
          )}
          <button
            onClick={onExit}
            className="rounded border border-ink-700 bg-ink-850 px-2 py-0.5 font-mono text-[10px] tracking-wide text-ink-300 hover:border-ink-600 hover:text-ink-100"
          >
            ESC
          </button>
        </div>
      </header>

      <div ref={scrollerRef} className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1" data-selectable>
        {messages.length === 0 && (
          <div className="my-auto flex flex-col items-center gap-1 text-center text-ink-400">
            <p className="text-[13px]">Ask anything. Run anything.</p>
            {activeLlmLabel ? (
              <p className="text-[11px] text-ink-500">
                Wired to <span className="text-mint-300">{activeLlmLabel}</span>.
                {' '}MCP tools active.
              </p>
            ) : (
              <p className="text-[11px] text-amber-400/80">
                No API key set — go to Settings → AI Providers.
              </p>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.filter((m) => m.role !== 'system' && !m.isToolResult).map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Tool calls */}
              {m.toolCalls?.map((tc, i) => (
                <div key={i} className="flex max-w-[90%] items-start gap-2 rounded border border-ink-700 bg-ink-900 px-2.5 py-1.5 text-[10.5px]">
                  <TerminalIcon className="mt-0.5 h-3 w-3 shrink-0 text-mint-400" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-mint-300">{tc.toolName.replace('__', '/')}</span>
                    {tc.result ? (
                      <span className="text-ink-400 line-clamp-2">{tc.result}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-ink-500">
                        <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }}>running…</motion.span>
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Message bubble */}
              {(m.content || m.streaming) && (
                <div
                  className={`max-w-[82%] rounded-md border px-3 py-2 ${
                    m.role === 'user'
                      ? 'border-mint-500/40 bg-mint-500/10 text-mint-50'
                      : 'border-ink-700 bg-ink-850 text-ink-100'
                  }`}
                >
                  {m.role === 'user' ? (
                    <p className="text-[13px] leading-relaxed">{m.content}</p>
                  ) : (
                    <ChatMessageContent content={m.content} />
                  )}
                  {m.streaming && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                      className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 bg-mint-400"
                    />
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="glide-no-drag mt-3 flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 focus-within:border-mint-500">
        <SparkleIcon className="h-3.5 w-3.5 text-mint-400/80" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          placeholder="Message Glide…"
          className="w-full bg-transparent text-[13px] text-ink-50 outline-none placeholder:text-ink-400"
        />
        <button
          onClick={submit}
          disabled={!draft.trim() || isAssistantTyping}
          className="rounded border border-mint-500/45 bg-mint-500/15 px-2.5 py-1 text-[11px] font-medium text-mint-100 transition-colors disabled:opacity-40 hover:enabled:border-mint-500 hover:enabled:bg-mint-500/25"
        >
          {isAssistantTyping ? (
            <span className="flex items-center gap-1">
              {[0,1,2].map((i) => (
                <motion.span key={i} animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} className="h-1 w-1 rounded-full bg-mint-300" />
              ))}
            </span>
          ) : 'Send'}
        </button>
      </div>
    </motion.div>
  );
}
