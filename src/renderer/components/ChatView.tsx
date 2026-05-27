import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useGlideStore } from '../store/useGlideStore';
import { SparkleIcon } from './icons';
import { LLM_MODELS, type LlmProvider } from '../../shared/llm';

const PROVIDER_LABEL: Record<LlmProvider, string> = {
  anthropic: 'Claude',
  openai: 'GPT',
  gemini: 'Gemini',
};

interface ChatViewProps {
  onExit(): void;
}

/**
 * Chat surface. Windows flat style, sharp corners, no floating bubbles.
 */
export function ChatView({ onExit }: ChatViewProps) {
  const { messages, appendMessage, isAssistantTyping, setAssistantTyping, llmConfigs } = useGlideStore();
  const [draft, setDraft] = useState('');
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Resolve active provider + model name for display
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isAssistantTyping]);

  async function submit() {
    const text = draft.trim();
    if (!text || isAssistantTyping) return;
    setDraft('');
    appendMessage({ role: 'user', content: text });
    setAssistantTyping(true);
    try {
      const res = await window.glide.chat.send({
        messages: [...messages, { role: 'user', content: text }],
      });
      appendMessage(res.reply);
    } catch (err) {
      appendMessage({
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'unknown'}`,
      });
    } finally {
      setAssistantTyping(false);
    }
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
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink-100">
            Chat
          </h2>
        </div>
        <button
          onClick={onExit}
          className="rounded border border-ink-700 bg-ink-850 px-2 py-0.5 font-mono text-[10px] tracking-wide text-ink-300 hover:border-ink-600 hover:text-ink-100"
        >
          ESC
        </button>
      </header>

      <div
        ref={scrollerRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1"
        data-selectable
      >
        {messages.length === 0 && (
          <div className="my-auto flex flex-col items-center gap-1 text-center text-ink-400">
            <p className="text-[13px]">Ask anything. Run anything.</p>
            {activeLlmLabel ? (
              <p className="text-[11px] text-ink-500">
                Wired to <span className="text-mint-300">{activeLlmLabel}</span>.
              </p>
            ) : (
              <p className="text-[11px] text-amber-400/80">
                No API key set — go to Settings → AI Providers.
              </p>
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[78%] rounded-md border px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'border-mint-500/40 bg-mint-500/10 text-mint-50'
                    : 'border-ink-700 bg-ink-850 text-ink-100'
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isAssistantTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-1 rounded-md border border-ink-700 bg-ink-850 px-3 py-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                  className="h-1.5 w-1.5 rounded-full bg-mint-300"
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="glide-no-drag mt-3 flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 focus-within:border-mint-500">
        <SparkleIcon className="h-3.5 w-3.5 text-mint-400/80" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Message Glide…"
          className="w-full bg-transparent text-[13px] text-ink-50 outline-none placeholder:text-ink-400"
        />
        <button
          onClick={submit}
          disabled={!draft.trim() || isAssistantTyping}
          className="rounded border border-mint-500/45 bg-mint-500/15 px-2.5 py-1 text-[11px] font-medium text-mint-100 transition-colors disabled:opacity-40 hover:enabled:border-mint-500 hover:enabled:bg-mint-500/25"
        >
          Send
        </button>
      </div>
    </motion.div>
  );
}
