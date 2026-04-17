import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useSessionState } from '../hooks/useSession';
import { listDropsByOrganizer, listPledgesByDrop } from '../lib/data';
import type { DropRecord } from '../lib/types';
import { formatDropTime, formatMoney } from '../lib/utils';

type Row = { drop: DropRecord; totalCents: number; pledgeCount: number };

export function DashboardPage(): React.ReactElement {
  const { session, loading: sessionLoading } = useSessionState();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const drops = await listDropsByOrganizer(session.email);
        const withTotals = await Promise.all(
          drops.map(async (drop) => {
            const pledges = await listPledgesByDrop(drop.id);
            return {
              drop,
              totalCents: pledges.reduce((acc, p) => acc + p.amountCents, 0),
              pledgeCount: pledges.length,
            };
          })
        );
        if (!cancelled) setRows(withTotals);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (sessionLoading) {
    return (
      <div className="max-w-5xl mx-auto px-5 pt-10 pb-24">
        <p className="text-ink-300">Loading your drops…</p>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="max-w-5xl mx-auto px-5 pt-10 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-5xl text-white">Your drops</h1>
          <p className="text-ink-300 mt-1 text-sm">Signed in as {session.email}</p>
        </div>
        <Link to="/new">
          <Button>Start a drop</Button>
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-drop-500/40 bg-drop-500/10 text-drop-200 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-ink-300">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-ink-700 bg-ink-800/60 p-10 text-center">
          <div className="font-display text-3xl text-white">No drops yet.</div>
          <p className="text-ink-300 mt-2 max-w-md mx-auto">
            Someone you love got hit with something hard? Start a drop and rally their people.
          </p>
          <div className="mt-5">
            <Link to="/new">
              <Button size="lg">Start a drop</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {rows.map(({ drop, totalCents, pledgeCount }, i) => (
            <motion.div
              key={drop.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/drops/${drop.id}`}
                className="block rounded-2xl border border-ink-700 bg-ink-800/70 p-5 hover:border-drop-400/60 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-drop-300">
                      {drop.status}
                    </div>
                    <div className="text-white text-xl font-semibold mt-1">
                      For {drop.recipientFirstName} · @{drop.recipientVenmoHandle}
                    </div>
                    <div className="text-ink-300 text-sm mt-1">
                      Drop day: {formatDropTime(drop.dropAtIso, drop.timezone)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-2xl font-bold">{formatMoney(totalCents)}</div>
                    <div className="text-ink-300 text-xs">
                      {pledgeCount} {pledgeCount === 1 ? 'pledge' : 'pledges'}
                      {drop.goalAmountCents ? ` of ${formatMoney(drop.goalAmountCents)}` : ''}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
