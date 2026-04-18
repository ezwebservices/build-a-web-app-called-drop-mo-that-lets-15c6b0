import { motion } from 'framer-motion';
import { formatDropTime, formatMoney } from '../lib/utils';
import type { DropRecord } from '../lib/types';

type Props = {
  drop: DropRecord;
  raisedCents?: number;
  contributorCount?: number;
};

export function EmailPreview({
  drop,
  raisedCents = 0,
  contributorCount = 0,
}: Props): React.ReactElement {
  const pct =
    drop.goalAmountCents && drop.goalAmountCents > 0
      ? Math.min(100, (raisedCents / drop.goalAmountCents) * 100)
      : 0;

  return (
    <div className="rounded-2xl border border-ink-200 overflow-hidden bg-white shadow-sm">
      <div className="bg-ink-100 px-4 py-2.5 flex items-center gap-2 text-xs text-ink-700">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-3 truncate">
          From {drop.organizerName || 'you'} via Drop · To: friend@example.com
        </span>
      </div>
      <div className="p-5 sm:p-6 md:p-8 bg-white">
        <div className="inline-flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-mint-400" />
          <span className="inline-block w-3 h-3 rounded-full bg-sun-400" />
          <span className="inline-block w-3.5 h-3.5 rounded-full bg-drop-600" />
          <span className="font-display text-2xl text-ink-900 ml-1">drop</span>
        </div>
        <h2 className="text-ink-900 text-xl sm:text-2xl md:text-3xl font-semibold mt-4 leading-tight">
          {drop.organizerName || 'Someone'} is putting together a small surprise for {drop.recipientFirstName}.
        </h2>
        <p className="text-ink-700 mt-4 whitespace-pre-line leading-relaxed">
          {drop.personalNote || drop.story}
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-5 rounded-2xl overflow-hidden border border-drop-100 bg-gradient-to-br from-drop-50 to-sun-100 p-5 sm:p-6"
        >
          <div className="text-drop-700 text-xs uppercase tracking-wider font-semibold">Live progress</div>
          <div className="text-ink-900 font-display text-2xl sm:text-3xl mt-1">For {drop.recipientFirstName}</div>
          <div className="text-ink-900 text-3xl sm:text-4xl font-bold mt-2 break-words">
            {formatMoney(raisedCents)}{' '}
            <span className="text-ink-500 text-base sm:text-lg font-medium">
              {drop.goalAmountCents ? `of ${formatMoney(drop.goalAmountCents)}` : 'pledged'}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-white/80 border border-drop-100 overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-drop-400 to-drop-600"
              style={{ width: `${drop.goalAmountCents ? pct : Math.min(100, contributorCount * 8)}%` }}
            />
          </div>
          <div className="text-ink-700 text-sm mt-3">
            {contributorCount} {contributorCount === 1 ? 'person has' : 'people have'} chipped in
          </div>
        </motion.div>

        <div className="mt-6">
          <div className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-drop-500 to-drop-600 text-white font-semibold shadow-md shadow-drop-600/20">
            Chip in →
          </div>
          <div className="text-ink-500 text-xs mt-4">
            Drop day: {formatDropTime(drop.dropAtIso, drop.timezone)}
          </div>
          <div className="text-ink-500 text-xs mt-2">
            {drop.recipientFirstName} doesn't know — please keep it that way.
          </div>
        </div>
      </div>
    </div>
  );
}
