import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Countdown } from '../components/Countdown';
import { Logo } from '../components/Logo';
import { store } from '../lib/store';
import { useStoreVersion } from '../hooks/useStore';
import { formatDropTime, formatMoney, venmoDeepLink } from '../lib/utils';

export function PledgeStatusPage(): React.ReactElement {
  const { token } = useParams();
  const [sp] = useSearchParams();
  useStoreVersion();
  const [justSent, setJustSent] = useState(false);

  const pledge = useMemo(() => (token ? store.getPledgeByToken(token) : null), [token]);
  const drop = useMemo(() => (pledge ? store.getDrop(pledge.dropId) : null), [pledge]);

  useEffect(() => {
    if (pledge && sp.get('sent') === '1' && pledge.status !== 'sent') {
      store.updatePledge(pledge.id, { status: 'sent' });
      setJustSent(true);
    }
  }, [pledge, sp]);

  if (!pledge || !drop) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Logo size={36} />
        <h1 className="font-display text-5xl text-white mt-6">Pledge not found.</h1>
        <p className="text-ink-300 mt-3">
          The link may have expired. If you pledged, check your email for the latest update.
        </p>
      </div>
    );
  }

  const isDropDay = Date.now() >= new Date(drop.dropAtIso).getTime();
  const note = pledge.note?.trim() || `For ${drop.recipientFirstName} ❤️`;
  const venmoUrl = venmoDeepLink(drop.recipientVenmoHandle, pledge.amountCents, note);

  function markSent(): void {
    store.updatePledge(pledge!.id, { status: 'sent' });
    setJustSent(true);
  }

  function markSkipped(): void {
    store.updatePledge(pledge!.id, { status: 'skipped' });
  }

  function resetStatus(): void {
    store.updatePledge(pledge!.id, { status: 'pledged' });
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
            className="mt-10 rounded-3xl border border-green-500/40 bg-green-500/10 p-8 text-center"
          >
            <div className="font-display text-5xl text-white">
              {justSent ? `You're a legend, ${pledge.contributorName.split(' ')[0]}.` : 'Already sent. ✓'}
            </div>
            <p className="text-ink-100 mt-3">
              {formatMoney(pledge.amountCents)} on its way to {drop.recipientFirstName}. Thanks for
              keeping the surprise intact.
            </p>
            <div className="mt-5">
              <Button variant="ghost" onClick={resetStatus}>
                Wait, I didn't actually send — undo
              </Button>
            </div>
          </motion.div>
        ) : pledge.status === 'skipped' ? (
          <div className="mt-10 rounded-3xl border border-ink-700 bg-ink-800/70 p-8 text-center">
            <h1 className="font-display text-4xl text-white">Marked as skipped.</h1>
            <p className="text-ink-300 mt-2">No worries. The drop still goes ahead.</p>
            <div className="mt-5">
              <Button onClick={resetStatus}>Actually, I'll still send</Button>
            </div>
          </div>
        ) : isDropDay ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-800 to-[#281813] p-8"
          >
            <div className="text-xs uppercase tracking-widest text-drop-300">It's drop day.</div>
            <h1 className="font-display text-5xl md:text-6xl text-white mt-3 leading-[0.95]">
              Send {formatMoney(pledge.amountCents)} to {drop.recipientFirstName} now.
            </h1>
            <p className="text-ink-200 mt-3">
              Tap the button — it opens Venmo with everything pre-filled. Everyone's sending at the
              same time.
            </p>
            <a href={venmoUrl} target="_blank" rel="noreferrer" className="block mt-6">
              <Button size="lg" className="w-full">
                Open Venmo · Send {formatMoney(pledge.amountCents)}
              </Button>
            </a>
            <div className="mt-5 flex flex-wrap gap-3 justify-center">
              <Button variant="outline" onClick={markSent}>
                I sent it
              </Button>
              <Button variant="ghost" onClick={markSkipped}>
                I can't this time
              </Button>
            </div>
            <div className="mt-6 text-xs text-ink-400 text-center">
              Recipient: @{drop.recipientVenmoHandle} · Note: "{note}"
            </div>
          </motion.div>
        ) : (
          <div className="mt-10 rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-800 to-[#281813] p-8">
            <div className="text-xs uppercase tracking-widest text-drop-300">You're locked in.</div>
            <h1 className="font-display text-5xl text-white mt-3">
              Pledged {formatMoney(pledge.amountCents)} for {drop.recipientFirstName}.
            </h1>
            <p className="text-ink-300 mt-3">
              We'll email you the one-tap Venmo link on drop day. In the meantime — zip it.
            </p>
            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-ink-300 mb-2">
                {formatDropTime(drop.dropAtIso, drop.timezone)}
              </div>
              <Countdown toIso={drop.dropAtIso} />
            </div>
            <div className="mt-6">
              <Link to={`/d/${drop.publicToken}`} className="text-drop-300 text-sm hover:text-drop-200">
                Change my pledge →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
