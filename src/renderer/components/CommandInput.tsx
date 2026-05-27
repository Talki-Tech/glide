import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useGlideStore } from '../store/useGlideStore';
import { SearchIcon } from './icons';

interface CommandInputProps {
  onSubmit(): void;
  onEnterChat(): void;
}

/**
 * Windows-style command input — solid surface, sharp 8px corners,
 * thin mint border that intensifies on focus. No floating glow card.
 */
export function CommandInput({ onSubmit, onEnterChat }: CommandInputProps) {
  const { query, setQuery } = useGlideStore();
  const [focused, setFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') inputRef.current?.focus();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={`glide-no-drag flex w-full items-center gap-3 rounded-lg border bg-ink-850 px-4 py-3 transition-colors duration-150 ${
        focused
          ? 'border-mint-500 shadow-[0_0_0_1px_rgba(31,227,154,0.35)]'
          : 'border-ink-700 hover:border-ink-600'
      }`}
    >
      <SearchIcon
        className={`h-[16px] w-[16px] shrink-0 transition-colors ${
          focused ? 'text-mint-400' : 'text-ink-400'
        }`}
      />

      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (e.metaKey || e.ctrlKey) {
              onEnterChat();
            } else {
              onSubmit();
            }
          }
        }}
        placeholder="Ask Glide or type a command…"
        spellCheck={false}
        autoComplete="off"
        className="w-full bg-transparent text-[14px] font-normal tracking-normal text-ink-50 outline-none placeholder:text-ink-400"
      />

      <kbd className="ml-auto hidden shrink-0 rounded border border-ink-700 bg-ink-900 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-300 sm:inline-flex">
        Ctrl+K
      </kbd>
    </motion.div>
  );
}
