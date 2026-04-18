import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
const TABS = ['story', 'contributors', 'activity', 'share'] as const;
type TabKey = (typeof TABS)[number];

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
  if (s === 'sent') return { label: 'Sent', cls: 'bg-mint-100 text-mint-600' };
  if (s === 'skipped') return { label: 'Stepped back', cls: 'bg-ink-100 text-ink-700' };
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
      <div className="rounded-2xl border border-dashed border-ink-200 bg-drop-50/40 p-8 text-center">
        <div className="text-ink-700 text-sm">
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

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(2)},${y(p.cumulative).toFixed(2)}`)
    .join(' ');
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
        className="w-full h-44 sm:h-56"
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="dropFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F86F37" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F86F37" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#dropFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#DB5A24"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle
            key={p.pledge.id}
            cx={x(p.t)}
            cy={y(p.cumulative)}
            r={hover === i ? 5 : 3}
            fill="#fff"
            stroke="#DB5A24"
            strokeWidth="2"
          />
        ))}
        {hp && (
          <line
            x1={x(hp.t)}
            x2={x(hp.t)}
            y1={PAD_T}
            y2={H - PAD_B}
            stroke="#FFA776"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
        )}
      </svg>
      {hp && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full bg-white border border-drop-100 rounded-xl shadow-lg px-3 py-2 text-xs whitespace-nowrap"
          style={{
            left: `${(x(hp.t) / W) * 100}%`,
            top: `${(y(hp.cumulative) / H) * 100}%`,
          }}
        >
          <div className="font-semibold text-ink-900">{displayName(hp.pledge)}</div>
          <div className="text-drop-700 font-bold">{formatMoney(hp.pledge.amountCents)}</div>
          <div className="text-ink-500">Total: {formatMoney(hp.cumulative)}</div>
        </div>
      )}
    </div>
  );
}

export function PublicDropPage(): React.ReactElement {
  const { token } = useParams();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [drop, setDrop] = useState<DropRecord | null>(null);
  const [pledges, setPledges] = useState<PledgeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const initialTab = (sp.get('tab') as TabKey) || 'story';
  const [tab, setTab] = useState<TabKey>(
    TABS.includes(initialTab) ? initialTab : 'story'
  );
  const pledgeRef = useRef<HTMLFormElement>(null);

  function selectTab(next: TabKey): void {
    setTab(next);
    const params = new URLSearchParams(sp);
    params.set('tab', next);
    setSp(params, { replace: true });
  }

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
    () =>
      [...pledges].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [pledges]
  );

  const raised = pledges.reduce((s, p) => s + p.amountCents, 0);

  function showToast(msg: string): void {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }

  async function copyMessage(): Promise<void> {
    if (!drop) return;
    const url = window.location.href.split('?')[0];
    const msg = `Hey — I'm helping put together a little Venmo surprise for ${drop.recipientFirstName}. We're all chipping in, then sending on the same day so it lands as one big wave of love. Want in? ${url}`;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: `A drop for ${drop.recipientFirstName}`,
          text: msg,
        });
        return;
      } catch {
        /* fall through */
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
      await navigator.clipboard.writeText(window.location.href.split('?')[0]);
      showToast('Link copied.');
    } catch {
      showToast('Could not copy the link.');
    }
  }

  function jumpToPledge(): void {
    pledgeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-drop-50 to-white">
        <div className="max-w-xl mx-auto px-5 py-24 text-center">
          <Logo size={36} />
          <p className="text-ink-500 mt-6">Loading…</p>
        </div>
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-drop-50 to-white">
        <div className="max-w-xl mx-auto px-5 py-24 text-center">
          <Logo size={36} />
          <h1 className="font-display text-3xl sm:text-5xl text-ink-900 mt-6">
            This link isn't working.
          </h1>
          <p className="text-ink-500 mt-3">
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
          <h1 className="font-display text-3xl sm:text-5xl text-ink-900 mt-6">
            This one's called off.
          </h1>
          <p className="text-ink-500 mt-3">
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
    if (!email.trim())
      return setErr('We need your email so we can send you the Venmo link on drop day.');
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

  const tabDefs: Array<{ key: TabKey; label: string }> = [
    { key: 'story', label: 'Story' },
    { key: 'contributors', label: `Contributors` },
    { key: 'activity', label: 'Activity' },
    { key: 'share', label: 'Share' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-drop-50 via-white to-white text-ink-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-5 pt-6 sm:pt-8 pb-32">
        <div className="flex justify-between items-center">
          <Logo />
          <div className="text-[11px] sm:text-xs text-ink-500 bg-white border border-drop-100 rounded-full px-2.5 py-1">
            shh — it's a surprise
          </div>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 sm:mt-8 rounded-3xl border border-drop-100 bg-white shadow-sm p-5 sm:p-8"
        >
          <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-widest text-drop-700 bg-drop-50 border border-drop-100 rounded-full px-3 py-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-drop-500 animate-pulse" />
            You're in on it
          </div>
          <h1 className="mt-4 font-display text-[1.9rem] sm:text-5xl md:text-6xl text-ink-900 leading-[1.05] sm:leading-[1] break-words">
            A little something for{' '}
            <span className="italic text-drop-700">{drop.recipientFirstName}</span>.
          </h1>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-ink-900 tracking-tight tabular-nums">
                  {formatMoney(raised)}
                </div>
                <div className="text-sm text-ink-700 mt-1">
                  {drop.goalAmountCents
                    ? `of ${formatMoney(drop.goalAmountCents)} goal`
                    : 'pledged so far'}{' '}
                  · {pledges.length} {pledges.length === 1 ? 'person' : 'people'} in
                </div>
              </div>
            </div>
            <div className="mt-3 h-3 rounded-full bg-drop-50 border border-drop-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${goalPct ?? Math.min(100, Math.log10(Math.max(1, raised / 100 + 1)) * 40)}%`,
                }}
                transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                className="h-full bg-gradient-to-r from-drop-400 to-drop-600"
              />
            </div>
          </div>

          {/* Countdown */}
          <div className="mt-6">
            <div className="text-[11px] sm:text-xs uppercase tracking-widest text-ink-700 mb-2 font-semibold">
              Drop day — {formatDropTime(drop.dropAtIso, drop.timezone)}
            </div>
            <Countdown toIso={drop.dropAtIso} />
          </div>

          {/* Primary CTA */}
          <div className="mt-6">
            <Button type="button" size="lg" onClick={jumpToPledge} className="w-full sm:w-auto">
              Chip in →
            </Button>
          </div>
        </motion.div>

        {/* Sticky tab nav */}
        <div
          role="tablist"
          aria-label="Drop details"
          className="sticky top-0 z-30 -mx-4 sm:-mx-5 mt-5 px-4 sm:px-5 py-2 bg-paper/90 backdrop-blur border-b border-drop-100"
        >
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {tabDefs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  aria-controls={`tab-panel-${t.key}`}
                  onClick={() => selectTab(t.key)}
                  className={`shrink-0 px-4 py-2.5 min-h-[44px] text-sm rounded-full border transition font-medium ${
                    active
                      ? 'bg-ink-900 text-white border-ink-900 shadow-sm'
                      : 'bg-white text-ink-700 border-drop-100 hover:bg-drop-50'
                  }`}
                >
                  {t.label}
                  {t.key === 'contributors' && pledges.length > 0 && (
                    <span
                      className={`ml-1.5 text-[11px] font-semibold ${
                        active ? 'text-white/80' : 'text-drop-700'
                      }`}
                    >
                      {pledges.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab panels */}
        <div className="mt-5">
          {tab === 'story' && (
            <motion.section
              key="story"
              id="tab-panel-story"
              role="tabpanel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-drop-100 bg-white shadow-sm p-5 sm:p-7"
            >
              <h2 className="font-display text-2xl text-ink-900">What's going on</h2>
              <div className="mt-3 text-ink-700 leading-relaxed prose prose-sm sm:prose-base max-w-none prose-headings:text-ink-900 prose-strong:text-ink-900 prose-a:text-drop-700">
                <ReactMarkdown>{drop.story}</ReactMarkdown>
              </div>
            </motion.section>
          )}

          {tab === 'contributors' && (
            <motion.section
              key="contributors"
              id="tab-panel-contributors"
              role="tabpanel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-drop-100 bg-white shadow-sm p-5 sm:p-7"
            >
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <h2 className="font-display text-2xl text-ink-900">Everyone in on it</h2>
                <div className="text-xs text-ink-500">
                  {pledges.length} total · newest first
                </div>
              </div>
              {newestFirst.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-ink-200 bg-drop-50/40 p-8 text-center">
                  <div className="text-3xl" aria-hidden="true">
                    🤫
                  </div>
                  <div className="text-ink-700 mt-2 text-sm">
                    No one's chipped in yet. You could kick it off.
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile: stacked cards */}
                  <ul className="mt-4 space-y-2 sm:hidden">
                    {newestFirst.map((p) => {
                      const s = statusLabel(p.status);
                      return (
                        <li
                          key={p.id}
                          className="flex items-center gap-3 rounded-2xl bg-drop-50/60 border border-drop-100 px-3.5 py-2.5"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-drop-100 text-drop-700 font-semibold shrink-0">
                            {displayName(p).slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-ink-900 truncate text-sm">
                                {displayName(p)}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}
                              >
                                {s.label}
                              </span>
                            </div>
                            <div className="text-[11px] text-ink-500 mt-0.5">
                              {timeAgo(p.createdAt)}
                            </div>
                          </div>
                          <div className="font-semibold text-ink-900 tabular-nums text-sm">
                            {formatMoney(p.amountCents)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {/* Desktop: table */}
                  <div className="mt-4 hidden sm:block max-h-[520px] overflow-auto rounded-2xl border border-drop-100">
                    <table className="w-full text-sm">
                      <thead className="bg-drop-50 sticky top-0">
                        <tr className="text-left text-ink-700">
                          <th className="px-4 py-2.5 font-semibold">Friend</th>
                          <th className="px-4 py-2.5 font-semibold">Status</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
                          <th className="px-4 py-2.5 font-semibold text-right">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newestFirst.map((p) => {
                          const s = statusLabel(p.status);
                          return (
                            <tr
                              key={p.id}
                              className="border-t border-drop-100 hover:bg-drop-50/40"
                            >
                              <td className="px-4 py-2.5 text-ink-900">{displayName(p)}</td>
                              <td className="px-4 py-2.5">
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}
                                >
                                  {s.label}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-ink-900">
                                {formatMoney(p.amountCents)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-ink-500 tabular-nums">
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
                </>
              )}
            </motion.section>
          )}

          {tab === 'activity' && (
            <motion.section
              key="activity"
              id="tab-panel-activity"
              role="tabpanel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="rounded-3xl border border-drop-100 bg-white shadow-sm p-5 sm:p-7">
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="font-display text-2xl text-ink-900">How it's adding up</h2>
                  <div className="text-xs text-ink-500 hidden sm:block">hover to peek</div>
                </div>
                <CumulativeChart pledges={pledges} />
              </div>

              <div className="rounded-3xl border border-drop-100 bg-white shadow-sm p-5 sm:p-7">
                <h2 className="font-display text-2xl text-ink-900">Live activity</h2>
                <p className="text-sm text-ink-500 mt-1">
                  Latest pledges and drop-day check-ins.
                </p>
                <div className="mt-4">
                  {newestFirst.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-ink-200 bg-drop-50/40 p-6 text-center text-ink-700 text-sm">
                      Quiet so far. Be the first to chip in.
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      <AnimatePresence initial={false}>
                        {newestFirst.slice(0, 10).map((p) => {
                          const s = statusLabel(p.status);
                          return (
                            <motion.li
                              key={p.id}
                              layout
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 12 }}
                              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                              className="flex items-center gap-3 rounded-2xl bg-drop-50/60 border border-drop-100 px-3.5 py-2.5"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-drop-100 text-drop-700 font-semibold shrink-0">
                                {displayName(p).slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-ink-900 truncate text-sm">
                                    {displayName(p)}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}
                                  >
                                    {s.label}
                                  </span>
                                </div>
                                <div className="text-[11px] text-ink-500 mt-0.5">
                                  {timeAgo(p.createdAt)}
                                </div>
                              </div>
                              <div className="font-semibold text-ink-900 tabular-nums text-sm">
                                {formatMoney(p.amountCents)}
                              </div>
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ul>
                  )}
                </div>
              </div>
            </motion.section>
          )}

          {tab === 'share' && (
            <motion.section
              key="share"
              id="tab-panel-share"
              role="tabpanel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-drop-100 bg-white shadow-sm p-5 sm:p-7"
            >
              <h2 className="font-display text-2xl text-ink-900">Bring more people in</h2>
              <p className="text-sm text-ink-700 mt-2 leading-relaxed">
                More pings = a bigger wave. Send this to the group chat, the family thread, old
                college friends — anyone who'd want in on a surprise for{' '}
                {drop.recipientFirstName}.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={copyMessage}
                  className="w-full sm:w-auto"
                >
                  Copy message
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={copyLink}
                  className="w-full sm:w-auto"
                >
                  Copy just the link
                </Button>
              </div>
              <div className="mt-5 rounded-2xl bg-drop-50 border border-drop-100 p-4 text-sm text-ink-700 leading-relaxed">
                "Hey — I'm helping put together a little Venmo surprise for{' '}
                <span className="font-semibold text-ink-900">{drop.recipientFirstName}</span>.
                We're all chipping in, then sending on the same day so it lands as one big wave of
                love. Want in?"
              </div>
              <p className="mt-4 text-xs text-ink-500">
                Please don't share anywhere {drop.recipientFirstName} will see — the surprise is
                the whole point.
              </p>
            </motion.section>
          )}
        </div>

        {/* Pledge form — always accessible, jump target */}
        <motion.form
          ref={pledgeRef}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={onPledge}
          id="chip-in"
          className="mt-8 rounded-3xl border border-drop-100 bg-white shadow-sm p-5 sm:p-8 space-y-5 scroll-mt-24"
        >
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-ink-900">
              Pick what you can chip in
            </h2>
            <p className="text-ink-700 text-sm mt-1">
              No charge today. On drop day we'll email you a Venmo link to send it yourself.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setAmount(String(s))}
                className={`px-4 py-2.5 min-h-[44px] text-sm font-medium rounded-full border transition ${
                  Number(amount) === s
                    ? 'bg-drop-600 border-drop-600 text-white shadow-sm'
                    : 'border-ink-200 text-ink-700 hover:border-drop-300 hover:text-drop-700 bg-white'
                }`}
              >
                {formatMoney(s * 100)}
              </button>
            ))}
          </div>
          <Field label="Your pledge">
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-xl bg-drop-50 border border-r-0 border-ink-200 text-ink-700 font-medium">
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
          <label className="flex items-center gap-3 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 accent-drop-600"
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
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? 'Saving…' : `Chip in ${formatMoney(parseDollarsToCents(amount))}`}
          </Button>
          <p className="text-xs text-ink-500 text-center">
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
            className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-ink-900 text-white text-sm px-4 py-2.5 rounded-full shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sticky CTA */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-drop-100 px-4 py-3">
        <Button type="button" size="md" onClick={jumpToPledge} className="w-full">
          Chip in — {pledges.length > 0 ? `${pledges.length} in so far` : 'be first'}
        </Button>
      </div>
    </div>
  );
}
