import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Button } from '../components/ui/Button';
import { Field, Input, Textarea } from '../components/ui/Input';
import { Countdown } from '../components/Countdown';
import { addPledge, getDropByToken, listPledgesByDrop } from '../lib/data';
import type { DropRecord, PledgeRecord } from '../lib/types';
import { formatDropTime, formatMoney, parseDollarsToCents } from '../lib/utils';
import { Logo } from '../components/Logo';

const SUGGESTED = [25, 50, 100, 250];

function displayName(p: PledgeRecord): string {
  if (p.anonymous) return 'Anonymous friend';
  return p.contributorName?.trim() || 'Friend';
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.max(1, Math.floor(diff / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function statusLabel(s: PledgeRecord['status']): { label: string; cls: string } {
  if (s === 'sent') return { label: 'Sent on drop day', cls: 'bg-emerald-100 text-emerald-700' };
  if (s === 'skipped') return { label: 'Stepped back', cls: 'bg-ink-100 text-ink-400' };
  return { label: 'Pledged', cls: 'bg-drop-100 text-drop-700' };
}

type ChartPoint = {
  t: number;
  cumulative: number;
  pledge: PledgeRecord;
};

function CumulativeChart({ pledges }: { pledges: PledgeRecord[] }): React.ReactElement {
  const [hover, setHover] = useState<number | null>(null);

  const points: ChartPoint[] = useMemo(() => {
    const sorted = [...pledges].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    let total = 0;
    return sorted.map((p) => {
      total += p.amountCents;
      return { t: new Date(p.createdAt).getTime(), cumulative: total, pledge: p };
    });
  }, [pledges]);

  const W = 640;
  const H = 200;
  const PAD_L = 12;
  const PAD_R = 12;
  const PAD_T = 16;
  const PAD_B = 24;

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-white/60 p-8 text-center">
        <div className="text-ink-400 text-sm">
          The chart fills in as people chip in. You could be first.
        </div>
      </div>
    );
  }

  const minT = points[0].t;
  const maxT = points[points.length - 1].t;
  const tSpan = Math.max(1, maxT - minT);
  const maxV = Math.max(...points.map((p) => p.cumulative));

  const x = (t: number): number => {
    if (points.length === 1) return (W - PAD_L - PAD_R) / 2 + PAD_L;
    return PAD_L + ((t - minT) / tSpan) * (W - PAD_L - PAD_R);
  };
  const y = (v: number): number => {
    return H - PAD_B - (v / Math.max(1, maxV)) * (H - PAD_T - PAD_B);
  };

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(2)},${y(p.cumulative).toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L${x(points[points.length - 1].t).toFixed(2)},${H - PAD_B} L${x(points[0].t).toFixed(2)},${H - PAD_B} Z`;

  function onMove(e: React.MouseEvent<SVGSVGElement>): void {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let bestI = 0;
    let bestD = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      const d = Math.abs(x(points[i].t) - px);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }
    setHover(bestI);
  }

  const hp = hover != null ? points[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-48 sm:h-56"
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="dropFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff9975" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff9975" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#dropFill)" />
        <path d={linePath} fill="none" stroke="#ff4714" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={p.pledge.id}
            cx={x(p.t)}
            cy={y(p.cumulative)}
            r={hover === i ? 5 : 3}
            fill="#fff"
            stroke="#ff4714"
            strokeWidth="2"
          />
        ))}
        {hp && (
          <line
            x1={x(hp.t)}
            x2={x(hp.t)}
            y1={PAD_T}
            y2={H - PAD_B}
            stroke="#ff9975"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
        )}
      </svg>
      {hp && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full bg-white border border-ink-100 rounded-xl shadow-lg px-3 py-2 text-xs whitespace-nowrap"
          style={{
            left: `${(x(hp.t) / W) * 100}%`,
            top: `${(y(hp.cumulative) / H) * 100}%`,
          }}
        >
          <div className="font-semibold text-ink-900">{displayName(hp.pledge)}</div>
          <div className="text-drop-600 font-bold">{formatMoney(hp.pledge.amountCents)}</div>
          <div className="text-ink-400">Total: {formatMoney(hp.cumulative)}</div>
        </div>
      )}
    </div>
  );
}

export function PublicDropPage(): React.ReactElement {
  const { token } = useParams();
  const nav = useNavigate();
  const [drop, setDrop] = useState<DropRecord | null>(null);
  const [pledges, setPledges] = useState<PledgeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const d = await getDropByToken(token);
        if (cancelled) return;
        setDrop(d);
        if (d) {
          const p = await listPledgesByDrop(d.id);
          if (!cancelled) setPledges(p);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [amount, setAmount] = useState('50');
  const [noteText, setNoteText] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const newestFirst = useMemo(
    () => [...pledges].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [pledges]
  );

  const raised = pledges.reduce((s, p) => s + p.amountCents, 0);

  function showToast(msg: string): void {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }

  async function copyMessage(): Promise<void> {
    if (!drop) return;
    const url = window.location.href;
    const msg = `Hey — I'm helping put together a little Venmo surprise for ${drop.recipientFirstName}. We're all chipping in, then sending on the same day so it lands as one big wave of love. Want in? ${url}`;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: `A drop for ${drop.recipientFirstName}`,
          text: msg,
        });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(msg);
      showToast('Message copied — paste it in your group chat.');
    } catch {
      showToast('Could not copy. Long-press to copy the URL.');
    }
  }

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied.');
    } catch {
      showToast('Could not copy the link.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-drop-50 to-white">
        <div className="max-w-xl mx-auto px-5 py-24 text-center">
          <Logo size={36} />
          <p className="text-ink-400 mt-6">Loading…</p>
        </div>
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-drop-50 to-white">
        <div className="max-w-xl mx-auto px-5 py-24 text-center">
          <Logo size={36} />
          <h1 className="font-display text-3xl sm:text-5xl text-ink-900 mt-6">This link isn't working.</h1>
          <p className="text-ink-400 mt-3">
            It may have been cancelled, or the URL got cut off. Check with whoever sent it.
          </p>
        </div>
      </div>
    );
  }

  if (drop.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-drop-50 to-white">
        <div className="max-w-xl mx-auto px-5 py-24 text-center">
          <Logo size={36} />
          <h1 className="font-display text-3xl sm:text-5xl text-ink-900 mt-6">This one's called off.</h1>
          <p className="text-ink-400 mt-3">
            The organizer cancelled it. Nothing to do — and please still keep it between us.
          </p>
        </div>
      </div>
    );
  }

  async function onPledge(e: FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    const cents = parseDollarsToCents(amount);
    if (cents < 100) return setErr('Pick an amount of at least $1.');
    if (!email.trim()) return setErr('We need your email so we can send you the Venmo link on drop day.');
    if (!anonymous && !name.trim()) return setErr("What's your name?");
    setSubmitting(true);
    try {
      const p = await addPledge({
        dropId: drop!.id,
        contributorName: name.trim() || 'Friend',
        contributorEmail: email.trim().toLowerCase(),
        anonymous,
        amountCents: cents,
        note: noteText.trim(),
      });
      nav(`/p/${p.pledgeToken}`);
    } catch (error) {
      setErr((error as Error).message);
      setSubmitting(false);
    }
  }

  const goalPct =
    drop.goalAmountCents && drop.goalAmountCents > 0
      ? Math.min(100, (raised / drop.goalAmountCents) * 100)
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-drop-50 via-white to-white text-ink-900">
      <div className="max-w-3xl mx-auto px-5 pt-8 pb-24">
        <div className="flex justify-between items-center">
          <Logo />
          <div className="text-xs text-ink-400">shh — it's a surprise</div>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 sm:mt-10 rounded-3xl border border-drop-100 bg-white shadow-sm p-6 sm:p-8 md:p-10"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-drop-600 bg-drop-50 border border-drop-100 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-drop-400 animate-pulse" />
            You're in on it
          </div>
          <h1 className="mt-5 font-display text-[2rem] sm:text-5xl md:text-6xl text-ink-900 leading-[1.05] sm:leading-[1] break-words">
            A little something for{' '}
            <span className="italic text-drop-500">{drop.recipientFirstName}</span>.
          </h1>
          <div className="mt-5 text-ink-500 leading-relaxed prose max-w-none">
            <ReactMarkdown>{drop.story}</ReactMarkdown>
          </div>

          {/* Progress */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink-900 tracking-tight">
                  {formatMoney(raised)}
                </div>
                <div className="text-sm text-ink-400 mt-1">
                  {drop.goalAmountCents ? `pledged of ${formatMoney(drop.goalAmountCents)} goal` : 'pledged so far'} ·{' '}
                  {pledges.length} {pledges.length === 1 ? 'person' : 'people'} in
                </div>
              </div>
            </div>
            <div className="h-3 rounded-full bg-drop-50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${goalPct ?? Math.min(100, Math.log10(Math.max(1, raised / 100 + 1)) * 40)}%`,
                }}
                transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                className="h-full bg-gradient-to-r from-drop-300 to-drop-500"
              />
            </div>
          </div>

          {/* Countdown */}
          <div className="mt-7">
            <div className="text-xs uppercase tracking-widest text-ink-400 mb-2">
              Drop day — {formatDropTime(drop.dropAtIso, drop.timezone)}
            </div>
            <Countdown toIso={drop.dropAtIso} />
          </div>

          {/* Share row */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" variant="primary" size="md" onClick={copyMessage}>
              Copy message
            </Button>
            <Button type="button" variant="outline" size="md" onClick={copyLink} className="border-drop-200 text-drop-700 hover:bg-drop-50">
              Copy link
            </Button>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-6 rounded-3xl border border-drop-100 bg-white shadow-sm p-6 sm:p-7"
        >
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-2xl text-ink-900">How it's adding up</h2>
            <div className="text-xs text-ink-400">hover to peek</div>
          </div>
          <CumulativeChart pledges={pledges} />
        </motion.div>

        {/* Activity feed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 rounded-3xl border border-drop-100 bg-white shadow-sm p-6 sm:p-7"
        >
          <h2 className="font-display text-2xl text-ink-900">Live activity</h2>
          <p className="text-sm text-ink-400 mt-1">Latest pledges and drop-day check-ins.</p>
          <div className="mt-5">
            {newestFirst.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-200 bg-white/60 p-6 text-center text-ink-400 text-sm">
                Quiet so far. Be the first to chip in.
              </div>
            ) : (
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {newestFirst.slice(0, 8).map((p) => {
                    const s = statusLabel(p.status);
                    return (
                      <motion.li
                        key={p.id}
                        layout
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                        className="flex items-center gap-3 rounded-2xl bg-drop-50/60 border border-drop-100/70 px-4 py-3"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-drop-100 text-drop-600 font-semibold">
                          {displayName(p).slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-ink-900 truncate">{displayName(p)}</span>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
                              {s.label}
                            </span>
                          </div>
                          <div className="text-xs text-ink-400 mt-0.5">{timeAgo(p.createdAt)}</div>
                        </div>
                        <div className="font-semibold text-ink-900 tabular-nums">
                          {formatMoney(p.amountCents)}
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </motion.div>

        {/* Log table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 rounded-3xl border border-drop-100 bg-white shadow-sm p-6 sm:p-7"
        >
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h2 className="font-display text-2xl text-ink-900">Everyone in on it</h2>
            <div className="text-xs text-ink-400">{pledges.length} total · newest first</div>
          </div>
          {newestFirst.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-ink-200 bg-white/60 p-8 text-center">
              <div className="text-3xl">🤫</div>
              <div className="text-ink-500 mt-2 text-sm">No one's chipped in yet. You could kick it off.</div>
            </div>
          ) : (
            <div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-ink-100">
              <table className="w-full text-sm">
                <thead className="bg-drop-50/80 sticky top-0">
                  <tr className="text-left text-ink-400">
                    <th className="px-4 py-2.5 font-medium">Friend</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                    <th className="px-4 py-2.5 font-medium text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {newestFirst.map((p) => {
                    const s = statusLabel(p.status);
                    return (
                      <tr key={p.id} className="border-t border-ink-100/80 hover:bg-drop-50/30">
                        <td className="px-4 py-2.5 text-ink-900">{displayName(p)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-ink-900">
                          {formatMoney(p.amountCents)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-ink-400 tabular-nums">
                          {new Date(p.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pledge form */}
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={onPledge}
          className="mt-6 rounded-3xl border border-drop-100 bg-white shadow-sm p-6 sm:p-8 md:p-10 space-y-5"
        >
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-ink-900">Pick what you can chip in</h2>
            <p className="text-ink-400 text-sm mt-1">
              No charge today. On drop day we'll email you a Venmo link to send it yourself.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setAmount(String(s))}
                className={`px-4 py-2.5 min-h-[44px] text-sm rounded-full border transition ${
                  Number(amount) === s
                    ? 'bg-drop-500 border-drop-500 text-white'
                    : 'border-ink-200 text-ink-500 hover:border-drop-300 hover:text-drop-600 bg-white'
                }`}
              >
                {formatMoney(s * 100)}
              </button>
            ))}
          </div>
          <Field label="Your pledge">
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-xl bg-drop-50 border border-r-0 border-ink-200 text-ink-500">
                $
              </span>
              <Input
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                className="rounded-l-none text-2xl font-semibold"
              />
            </div>
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Your name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jamie"
                disabled={anonymous}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jamie@gmail.com"
              />
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm text-ink-500">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 accent-drop-500"
            />
            Show me as "Anonymous friend"
          </label>
          <Field
            label="Note for the organizer"
            optional
            hint="Won't show up in the Venmo note — we'll fill in a nice one."
          >
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Love them. Count me in for more if needed."
            />
          </Field>
          {err && <p className="text-sm text-drop-600">{err}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting
              ? 'Saving…'
              : `Chip in ${formatMoney(parseDollarsToCents(amount))}`}
          </Button>
          <p className="text-xs text-ink-400 text-center">
            We don't charge you. You'll send the money on Venmo when the day comes.
          </p>
        </motion.form>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink-900 text-white text-sm px-4 py-2.5 rounded-full shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
