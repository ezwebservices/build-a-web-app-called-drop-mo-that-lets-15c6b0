import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export function Logo({ className, size = 28 }: { className?: string; size?: number }): React.ReactElement {
  return (
    <span className={cn('inline-flex items-center gap-2 text-ink-900', className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        initial={{ rotate: 0 }}
        whileHover={{ rotate: [0, -4, 4, 0] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        aria-hidden="true"
      >
        <g transform="rotate(8 28 28)">
          <motion.circle
            cx="14"
            cy="14"
            r="6"
            fill="#5FCB95"
            initial={{ y: -18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0, type: 'spring', stiffness: 320, damping: 18 }}
          />
          <motion.circle
            cx="28"
            cy="28"
            r="7.5"
            fill="#F2BE3D"
            initial={{ y: -22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.06, type: 'spring', stiffness: 320, damping: 18 }}
          />
          <motion.circle
            cx="44"
            cy="44"
            r="9"
            fill="#DB5A24"
            initial={{ y: -28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.12, type: 'spring', stiffness: 320, damping: 18 }}
          />
        </g>
      </motion.svg>
      <span className="font-display text-2xl leading-none tracking-tight">drop</span>
    </span>
  );
}
