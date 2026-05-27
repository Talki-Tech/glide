import { motion } from 'framer-motion';
import type { QuickAction } from '../lib/types';

interface QuickActionsSidebarProps {
  actions: QuickAction[];
  onAction(a: QuickAction): void;
}

/**
 * Right-side quick action rail. Compact Windows-style buttons,
 * flat surfaces, no glassmorphism.
 */
export function QuickActionsSidebar({ actions, onAction }: QuickActionsSidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="glide-no-drag flex h-full w-[180px] shrink-0 flex-col border-l border-ink-800 bg-ink-900 pl-4"
    >
      <header className="mb-3 px-1 pt-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
          Quick Actions
        </span>
      </header>

      <ul className="flex flex-col gap-1.5">
        {actions.map((a, i) => (
          <motion.li
            key={a.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 26,
              delay: 0.05 + i * 0.04,
            }}
          >
            <button
              onClick={() => onAction(a)}
              className="w-full rounded border border-ink-700 bg-ink-850 px-3 py-2 text-left text-[12px] font-medium text-ink-100 transition-colors duration-100 hover:border-mint-500/60 hover:bg-ink-800 hover:text-mint-200"
            >
              {a.label}
            </button>
          </motion.li>
        ))}
      </ul>
    </motion.aside>
  );
}
