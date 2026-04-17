import { motion } from 'framer-motion';
import { formatMoney } from '../lib/utils';

type Props = {
  raisedCents: number;
  goalCents: number | null;
  contributorCount: number;
};

export function ProgressBar({ raisedCents, goalCents, contributorCount }: Props): React.ReactElement {
  const pct = goalCents && goalCents > 0 ? Math.min(100, (raisedCents / goalCents) * 100) : null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            {formatMoney(raisedCents)}
          </div>
          <div className="text-sm text-ink-300 mt-1">
            {goalCents ? `pledged of ${formatMoney(goalCents)} goal` : 'pledged so far'} · {contributorCount}{' '}
            {contributorCount === 1 ? 'person' : 'people'} in on it
          </div>
        </div>
      </div>
      <div className="h-3 rounded-full bg-ink-700 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct ?? Math.min(100, Math.log10(Math.max(1, raisedCents / 100 + 1)) * 40)}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="h-full bg-gradient-to-r from-drop-400 to-drop-600"
        />
      </div>
    </div>
  );
}
