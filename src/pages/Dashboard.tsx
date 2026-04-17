import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { useSession } from '../hooks/useSession';
import { store } from '../lib/store';
import { useStoreVersion } from '../hooks/useStore';
import { formatDropTime, formatMoney } from '../lib/utils';

export function DashboardPage(): React.ReactElement {
  useStoreVersion();
  const session = useSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  const drops = store.listDropsByOwner(session.email);

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

      {drops.length === 0 ? (
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
          {drops.map((d, i) => {
            const pledges = store.listPledgesByDrop(d.id);
            const total = pledges.reduce((acc, p) => acc + p.amountCents, 0);
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/drops/${d.id}`}
                  className="block rounded-2xl border border-ink-700 bg-ink-800/70 p-5 hover:border-drop-400/60 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-drop-300">
                        {d.status}
                      </div>
                      <div className="text-white text-xl font-semibold mt-1">
                        For {d.recipientFirstName} · @{d.recipientVenmoHandle}
                      </div>
                      <div className="text-ink-300 text-sm mt-1">
                        Drop day: {formatDropTime(d.dropAtIso, d.timezone)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-2xl font-bold">{formatMoney(total)}</div>
                      <div className="text-ink-300 text-xs">
                        {pledges.length} {pledges.length === 1 ? 'pledge' : 'pledges'}
                        {d.goalAmountCents ? ` of ${formatMoney(d.goalAmountCents)}` : ''}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
