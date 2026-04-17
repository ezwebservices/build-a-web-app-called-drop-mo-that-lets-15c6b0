import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export function Logo({ className, size = 28 }: { className?: string; size?: number }): React.ReactElement {
  return (
    <span className={cn('inline-flex items-center gap-2 text-white', className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        initial={{ rotate: -8 }}
        animate={{ rotate: [-8, 4, -4, 0] }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff9975" />
            <stop offset="1" stopColor="#ed2f09" />
          </linearGradient>
        </defs>
        <path
          d="M32 4c-9 13-16 22-16 32a16 16 0 0 0 32 0c0-10-7-19-16-32z"
          fill="url(#logoGrad)"
        />
      </motion.svg>
      <span className="font-display text-2xl leading-none">Drop</span>
    </span>
  );
}
