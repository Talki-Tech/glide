import { motion } from 'framer-motion';
import { GlideMark } from './icons';

/**
 * Brand lockup — bolt mark + "GLIDE | CORE" wordmark.
 * The mark gets a subtle continuous spring animation on first mount
 * so the eye lands here as the window enters.
 */
export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        initial={{ rotate: -18, scale: 0.85, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-mint-400/25 via-mint-500/10 to-transparent shadow-mint-glow-soft"
      >
        <GlideMark className="h-5 w-5 text-mint-400 drop-shadow-[0_0_12px_rgba(31,227,154,0.55)]" />
        <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-mint-400/30" />
      </motion.div>

      <div className="flex items-baseline gap-2 leading-none">
        <span className="text-[15px] font-semibold tracking-[0.16em] text-ink-50">GLIDE</span>
        <span className="text-ink-500">|</span>
        <span className="text-[12px] font-medium tracking-[0.22em] text-ink-300">CORE</span>
      </div>
    </div>
  );
}
