import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Button } from '../components/ui/Button';
import { Field, Input, Textarea } from '../components/ui/Input';
import { ProgressBar } from '../components/ProgressBar';
import { Countdown } from '../components/Countdown';
import { addPledge, getDropByToken, listPledgesByDrop } from '../lib/data';
import type { DropRecord, PledgeRecord } from '../lib/types';
import { formatDropTime, formatMoney, parseDollarsToCents } from '../lib/utils';
import { Logo } from '../components/Logo';

const SUGGESTED = [25, 50, 100, 250];

export function PublicDropPage(): React.ReactElement {
  const { token } = useParams();
  const nav = useNavigate();
  const [drop, setDrop] = useState<DropRecord | null>(null);
  const [pledges, setPledges] = useState<PledgeRecord[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Logo size={36} />
        <p className="text-ink-300 mt-6">Loading the drop…</p>
      </div>
    );
  }

  if (!drop) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Logo size={36} />
        <h1 className="font-display text-3xl sm:text-5xl text-white mt-6">Link's not working.</h1>
        <p className="text-ink-300 mt-3">
          The drop may have been cancelled, or the URL got mangled. Ping whoever sent it.
        </p>
      </div>
    );
  }

  if (drop.status === 'cancelled') {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <Logo size={36} />
        <h1 className="font-display text-3xl sm:text-5xl text-white mt-6">This drop was called off.</h1>
        <p className="text-ink-300 mt-3">
          The organizer cancelled the drop. No action needed — and please still keep the surprise.
        </p>
      </div>
    );
  }

  const raised = pledges.reduce((s, p) => s + p.amountCents, 0);

  async function onPledge(e: FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    const cents = parseDollarsToCents(amount);
    if (cents < 100) return setErr('Pick an amount of at least $1.');
    if (!email.trim()) return setErr('We need your email to send you the drop-day link.');
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

  return (
    <div className="relative">
      <div className="absolute inset-0 grain pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-5 pt-10 pb-24">
        <div className="flex justify-between items-center">
          <Logo />
          <div className="text-xs text-ink-300">shhh · keep the surprise</div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 sm:mt-10 rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-800 to-[#281813] p-5 sm:p-7 md:p-10"
        >
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-drop-300 bg-drop-900/30 border border-drop-700/60 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-drop-400 animate-pulse" />
            You're in on the surprise
          </div>
          <h1 className="mt-5 font-display text-[2rem] sm:text-5xl md:text-7xl text-white leading-[1.05] sm:leading-[0.95] break-words">
            Let's rally for{' '}
            <span className="italic text-drop-400">{drop.recipientFirstName}</span>.
          </h1>
          <div className="mt-5 text-ink-200 leading-relaxed prose prose-invert max-w-none">
            <ReactMarkdown>{drop.story}</ReactMarkdown>
          </div>
          <div className="mt-8">
            <ProgressBar
              raisedCents={raised}
              goalCents={drop.goalAmountCents ?? null}
              contributorCount={pledges.length}
            />
          </div>
          <div className="mt-6">
            <div className="text-xs uppercase tracking-widest text-ink-300 mb-2">
              Drop day — {formatDropTime(drop.dropAtIso, drop.timezone)}
            </div>
            <Countdown toIso={drop.dropAtIso} />
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={onPledge}
          className="mt-8 rounded-3xl border border-ink-700 bg-ink-800/60 p-5 sm:p-7 md:p-10 space-y-5"
        >
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-white">How much are you in for?</h2>
            <p className="text-ink-300 text-sm mt-1">
              You won't send anything today — just pledge. On drop day, we'll email you a one-tap
              Venmo link.
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
                    ? 'bg-drop-500 border-drop-400 text-white'
                    : 'border-ink-600 text-ink-200 hover:border-ink-400'
                }`}
              >
                {formatMoney(s * 100)}
              </button>
            ))}
          </div>
          <Field label="Your pledge">
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-xl bg-ink-700 border border-r-0 border-ink-600 text-ink-300">
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
          <label className="flex items-center gap-3 text-sm text-ink-200">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 accent-drop-500"
            />
            Show me as "Anonymous friend" on the organizer dashboard
          </label>
          <Field
            label="Note for the organizer"
            optional
            hint="Won't appear in the Venmo note — we'll auto-fill a nice one."
          >
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Love her. Count me in for more if needed."
            />
          </Field>
          {err && <p className="text-sm text-drop-300">{err}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting
              ? 'Locking it in…'
              : `I'm in for ${formatMoney(parseDollarsToCents(amount))}`}
          </Button>
          <p className="text-xs text-ink-400 text-center">
            Drop doesn't charge you. On drop day you'll send the amount yourself via Venmo.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
