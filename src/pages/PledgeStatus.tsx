import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Countdown } from '../components/Countdown';
import { Logo } from '../components/Logo';
import { getDrop, getPledgeByToken, updatePledgeStatus } from '../lib/data';
import type { DropRecord, PledgeRecord } from '../lib/types';
import { formatDropTime, formatMoney, venmoDeepLink } from '../lib/utils';

export function PledgeStatusPage(): React.ReactElement {
  const { token } = useParams();
  const [sp] = useSearchParams();
  const [pledge, setPledge] = useState<PledgeRecord | null>(null);
  const [drop, setDrop] = useState<DropRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [justSent, setJustSent] = useState(false);
  const autoMarkRan = useRef(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const p = await getPledgeByToken(token);
      if (cancelled) return;
      setPledge(p);
      if (p) {
        const d = await getDrop(p.dropId);
        if (!cancelled) setDrop(d);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!pledge) return;
    if (autoMarkRan.current) return;
    if (sp.get('sent') === '1' && pledge.status !== 'sent') {
      autoMarkRan.current = true;
      void updatePledgeStatus(pledge.id, 'sent').then((updated) => {
        setPledge(updated);
        setJustSent(true);
      });
    }
  }, [pledge, sp]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Logo size={36} />
        <p className="text-ink-500 mt-6">Loading your pledge…</p>
      </div>
    );
  }

  if (!pledge || !drop) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Logo size={36} />
        <h1 className="font-display text-3xl sm:text-5xl text-ink-900 mt-6">Pledge not found.</h1>
        <p className="text-ink-500 mt-3">
          The link may have expired. If you pledged, check your email for the latest update.
        </p>
      </div>
    );
  }

  const isDropDay = Date.now() >= new Date(drop.dropAtIso).getTime();
  const note = pledge.note?.trim() || `For ${drop.recipientFirstName} ❤️`;
  const venmoUrl = venmoDeepLink(drop.recipientVenmoHandle, pledge.amountCents, note);

  async function markSent(): Promise<void> {
    const updated = await updatePledgeStatus(pledge!.id, 'sent');
    setPledge(updated);
    setJustSent(true);
  }

  async function markSkipped(): Promise<void> {
    const updated = await updatePledgeStatus(pledge!.id, 'skipped');
    setPledge(updated);
  }

  async function resetStatus(): Promise<void> {
    const updated = await updatePledgeStatus(pledge!.id, 'pledged');
    setPledge(updated);
    setJustSent(false);
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 grain pointer-events-none" />
      <div className="relative max-w-2xl mx-auto px-5 pt-10 pb-24">
        <Logo />

        {pledge.status === 'sent' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 sm:mt-10 rounded-3xl border border-mint-400 bg-mint-100 p-6 sm:p-8 text-center"
          >
            <div className="font-display text-3xl sm:text-5xl text-ink-900">
              {justSent ? `Thank you, ${pledge.contributorName.split(' ')[0]}.` : 'Already sent. ✓'}
            </div>
            <p className="text-ink-700 mt-3">
              {formatMoney(pledge.amountCents)} on its way to {drop.recipientFirstName}. Thanks for
              keeping it a surprise.
            </p>
            <div className="mt-5">
              <Button variant="ghost" onClick={resetStatus}>
                Wait, I didn't actually send — undo
              </Button>
            </div>
          </motion.div>
        ) : pledge.status === 'skipped' ? (
          <div className="mt-8 sm:mt-10 rounded-3xl border border-drop-100 bg-white shadow-sm p-6 sm:p-8 text-center">
            <h1 className="font-display text-3xl sm:text-4xl text-ink-900">Marked as skipped.</h1>
            <p className="text-ink-500 mt-2">No worries. The drop still goes ahead.</p>
            <div className="mt-5">
              <Button onClick={resetStatus}>Actually, I'll still send</Button>
            </div>
          </div>
        ) : isDropDay ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 sm:mt-10 rounded-3xl border border-drop-100 bg-gradient-to-br from-drop-50 via-white to-sun-100 shadow-sm p-6 sm:p-8"
          >
            <div className="text-xs uppercase tracking-widest text-drop-700">Today's the day</div>
            <h1 className="font-display text-[1.75rem] sm:text-5xl md:text-6xl text-ink-900 mt-3 leading-[1.05] sm:leading-[0.95] break-words">
              Send {formatMoney(pledge.amountCents)} to {drop.recipientFirstName} now.
            </h1>
            <p className="text-ink-700 mt-3">
              Tap the button — it opens Venmo with everything filled in. Everyone's sending right
              around now.
            </p>
            <a href={venmoUrl} target="_blank" rel="noreferrer" className="block mt-6">
              <Button size="lg" className="w-full">
                Open Venmo · Send {formatMoney(pledge.amountCents)}
              </Button>
            </a>
            <div className="mt-5 flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
              <Button variant="outline" onClick={markSent} className="w-full sm:w-auto">
                I sent it
              </Button>
              <Button variant="ghost" onClick={markSkipped} className="w-full sm:w-auto">
                I can't this time
              </Button>
            </div>
            <div className="mt-6 text-xs text-ink-600 text-center">
              Recipient: @{drop.recipientVenmoHandle} · Note: "{note}"
            </div>
          </motion.div>
        ) : (
          <div className="mt-8 sm:mt-10 rounded-3xl border border-drop-100 bg-gradient-to-br from-drop-50 via-white to-sun-100 shadow-sm p-6 sm:p-8">
            <div className="text-xs uppercase tracking-widest text-drop-700">You're all set</div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-ink-900 mt-3 break-words">
              Pledged {formatMoney(pledge.amountCents)} for {drop.recipientFirstName}.
            </h1>
            <p className="text-ink-500 mt-3">
              We'll email you a Venmo link when the day comes. Until then, please keep it to
              yourself.
            </p>
            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-ink-500 mb-2">
                {formatDropTime(drop.dropAtIso, drop.timezone)}
              </div>
              <Countdown toIso={drop.dropAtIso} />
            </div>
            <div className="mt-6">
              <Link to={`/d/${drop.publicToken}`} className="text-drop-700 text-sm hover:text-drop-800 underline-offset-2 hover:underline">
                Change my pledge →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
