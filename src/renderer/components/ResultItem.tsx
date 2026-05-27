import { motion, useReducedMotion } from 'framer-motion';
import type { CommandEntry } from '../lib/types';

interface ResultItemProps {
  entry: CommandEntry;
  index: number;
  isActive: boolean;
  onHover(): void;
  onClick(): void;
}

/**
 * Result row. Windows-style: flat surface, tight 6px corners,
 * left mint accent bar on active, no floating glow.
 */
export function ResultItem({ entry, index, isActive, onHover, onClick }: ResultItemProps) {
  const reduce = useReducedMotion();
  const isPrimary = entry.emphasis === 'primary';

  return (
    <motion.div
      onPointerEnter={onHover}
      onClick={onClick}
      role="option"
      aria-selected={isActive}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 340,
        damping: 28,
        delay: reduce ? 0 : 0.025 + index * 0.03,
      }}
      className={`glide-no-drag group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-md border px-3 py-2.5 transition-colors duration-100 ${
        isActive
          ? isPrimary
            ? 'border-mint-500 bg-mint-500/10'
            : 'border-mint-500/60 bg-ink-800'
          : isPrimary
            ? 'border-mint-500/40 bg-mint-500/[0.04] hover:bg-mint-500/[0.07]'
            : 'border-ink-700 bg-ink-850 hover:border-ink-600 hover:bg-ink-800'
      }`}
    >
      {/* Left mint accent bar on active */}
      {isActive && (
        <motion.span
          layoutId="active-accent-bar"
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-sm bg-mint-400"
        />
      )}

      {/* Icon */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${
          isPrimary || isActive
            ? 'bg-mint-500/15 text-mint-300'
            : 'bg-ink-800 text-ink-300 group-hover:text-mint-300'
        }`}
      >
        <entry.Icon className="h-[16px] w-[16px]" />
      </div>

      {/* Label + description */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className={`truncate text-[13px] font-medium ${
            isActive ? 'text-white' : 'text-ink-100'
          }`}
        >
          {entry.label}
        </span>
        {entry.description && (
          <span className="truncate text-[11px] text-ink-400">{entry.description}</span>
        )}
      </div>

      {/* Shortcut */}
      {entry.shortcut && (
        <kbd
          className={`ml-auto shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wide ${
            isActive
              ? 'border-mint-500/45 bg-mint-500/15 text-mint-100'
              : 'border-ink-700 bg-ink-900 text-ink-300'
          }`}
        >
          {entry.shortcut}
        </kbd>
      )}
    </motion.div>
  );
}
