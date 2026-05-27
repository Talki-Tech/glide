import { AnimatePresence, motion } from 'framer-motion';
import { useGlideStore } from '../store/useGlideStore';
import type { CommandEntry } from '../lib/types';
import { ResultItem } from './ResultItem';

interface ResultListProps {
  results: CommandEntry[];
  onRun(entry: CommandEntry): void;
}

/**
 * Filtered command list. Items stagger in via Framer Motion in ResultItem.
 * Active selection driven by Zustand store.
 */
export function ResultList({ results, onRun }: ResultListProps) {
  const { selectedIndex, setSelectedIndex } = useGlideStore();

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-8 text-center"
      >
        <p className="text-[13px] font-medium text-ink-200">No matches.</p>
        <p className="text-[11px] text-ink-400">
          Press <kbd className="mx-1 rounded border border-ink-700 bg-ink-850 px-1 py-0.5 font-mono text-[10px] text-ink-300">Ctrl+↵</kbd>
          to ask Glide in chat.
        </p>
      </motion.div>
    );
  }

  return (
    <div
      role="listbox"
      aria-label="Glide commands"
      className="flex flex-1 flex-col gap-0.5 overflow-y-auto pr-0.5"
    >
      <AnimatePresence initial={false}>
        {results.map((entry, i) => (
          <ResultItem
            key={entry.id}
            entry={entry}
            index={i}
            isActive={i === selectedIndex}
            onHover={() => setSelectedIndex(i)}
            onClick={() => onRun(entry)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
