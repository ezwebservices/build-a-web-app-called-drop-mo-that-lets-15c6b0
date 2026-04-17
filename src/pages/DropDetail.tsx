import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Field, Input, Textarea } from '../components/ui/Input';
import { ProgressBar } from '../components/ProgressBar';
import {
  addInvites,
  getDrop,
  listInvitesByDrop,
  listPledgesByDrop,
  markInviteResent,
  updateDrop,
} from '../lib/data';
import type { DropRecord, InviteRecord, PledgeRecord } from '../lib/types';
import { formatDropTime, formatMoney, parseEmailList } from '../lib/utils';
import { getPublicShareUrl } from '../lib/amplify';

export function DropDetailPage(): React.ReactElement {
  const { id } = useParams();
  const nav = useNavigate();
  const [drop, setDrop] = useState<DropRecord | null>(null);
  const [pledges, setPledges] = useState<PledgeRecord[]>([]);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [dropAt, setDropAt] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!id) return;
    const [d, p, i] = await Promise.all([
      getDrop(id),
      listPledgesByDrop(id),
      listInvitesByDrop(id),
    ]);
    setDrop(d);
    setPledges(p);
    setInvites(i);
    if (d && !dropAt) setDropAt(d.dropAtIso.slice(0, 16));
  }, [id, dropAt]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const interval = window.setInterval(() => {
      if (!cancelled) void refresh().catch(() => undefined);
    }, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(message: string): void {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <p className="text-ink-300">Loading the drop…</p>
      </div>
    );
  }
  if (!drop) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-5xl text-white">Drop not found</h1>
        {error && <p className="text-ink-300 mt-3 text-sm">{error}</p>}
      </div>
    );
  }

  const raised = pledges.reduce((s, p) => s + p.amountCents, 0);
  const shareBase = getPublicShareUrl();
  const shareUrl = shareBase
    ? `${shareBase.replace(/\/+$/, '')}/s/${drop.publicToken}`
    : `${window.location.origin}/d/${drop.publicToken}/`;

  async function onInviteMore(): Promise<void> {
    const list = parseEmailList(inviteEmails);
    if (list.length === 0) return;
    try {
      await addInvites(drop!.id, list);
      setInviteEmails('');
      setShowInvite(false);
      await refresh();
    } catch (err) {
      showToast((err as Error).message);
    }
  }

  async function onNudge(email: string): Promise<void> {
    try {
      await markInviteResent(drop!.id, email);
      await refresh();
    } catch (err) {
      showToast((err as Error).message);
    }
  }

  function onCopyLink(): void {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => showToast('Link copied to clipboard'))
      .catch(() => showToast('Couldn\u2019t copy — long-press the link to copy manually'));
  }

  function onCopyLinkForText(): void {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() =>
        showToast('Link copied — paste into iMessage, WhatsApp, or any group chat'),
      )
      .catch(() => showToast('Couldn\u2019t copy — long-press the link to copy manually'));
  }

  async function onPostpone(): Promise<void> {
    if (!dropAt) return;
    try {
      await updateDrop(drop!.id, { dropAtIso: new Date(dropAt).toISOString() });
      setEditOpen(false);
      await refresh();
    } catch (err) {
      showToast((err as Error).message);
    }
  }

  async function onCancel(): Promise<void> {
    if (!window.confirm('Cancel this drop? Contributors will stop receiving reminders.')) return;
    try {
      await updateDrop(drop!.id, { status: 'cancelled' });
      nav('/dashboard');
    } catch (err) {
      showToast((err as Error).message);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pt-10 pb-24">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-drop-300">{drop.status}</div>
          <h1 className="font-display text-5xl text-white">
            Drop for {drop.recipientFirstName}
          </h1>
          <p className="text-ink-300 text-sm mt-1">
            @{drop.recipientVenmoHandle} · {formatDropTime(drop.dropAtIso, drop.timezone)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/drops/${drop.id}/review`}>
            <Button variant="outline">Edit invite</Button>
          </Link>
          <Button variant="outline" onClick={() => setEditOpen((v) => !v)}>
            Postpone
          </Button>
          <Button variant="danger" onClick={onCancel}>
            Cancel drop
          </Button>
        </div>
      </div>

      {editOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl border border-ink-700 bg-ink-800/70 p-5 flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[220px]">
            <Field label="New drop day & time">
              <Input
                type="datetime-local"
                value={dropAt}
                onChange={(e) => setDropAt(e.target.value)}
              />
            </Field>
          </div>
          <Button onClick={onPostpone}>Save</Button>
          <Button variant="ghost" onClick={() => setEditOpen(false)}>
            Nevermind
          </Button>
        </motion.div>
      )}

      <div className="mt-8 rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-800 to-[#281813] p-6 md:p-8">
        <ProgressBar
          raisedCents={raised}
          goalCents={drop.goalAmountCents ?? null}
          contributorCount={pledges.length}
        />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={onCopyLinkForText} aria-label="Copy link for text message">
            <span aria-hidden="true">💬</span> Copy link for text
          </Button>
          <Button variant="outline" onClick={onCopyLink}>
            Copy share link
          </Button>
          <Link to={`/d/${drop.publicToken}`} target="_blank" rel="noreferrer">
            <Button variant="ghost">Open public page ↗</Button>
          </Link>
        </div>
        <p className="mt-3 text-xs text-ink-400">
          Previews as a branded card in most messaging apps (iMessage, WhatsApp, Slack, Discord).
        </p>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-ink-900/95 border border-drop-500/40 text-white text-sm px-5 py-3 shadow-2xl shadow-black/50 backdrop-blur"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 grid md:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl font-semibold">
              Pledges <span className="text-ink-400">({pledges.length})</span>
            </h2>
          </div>
          {pledges.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-ink-600 p-6 text-center text-ink-300 text-sm">
              No pledges yet. As invites land, they'll show up here live.
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-ink-700 border border-ink-700 rounded-xl overflow-hidden bg-ink-800/60">
              {pledges.map((p) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <div className="text-white font-medium">
                      {p.anonymous ? 'Anonymous friend' : p.contributorName}
                    </div>
                    {p.note && <div className="text-ink-300 text-xs mt-0.5">{p.note}</div>}
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">{formatMoney(p.amountCents)}</div>
                    <div className="text-xs">
                      {p.status === 'sent' ? (
                        <span className="text-green-400">✓ sent</span>
                      ) : p.status === 'skipped' ? (
                        <span className="text-ink-400">skipped</span>
                      ) : (
                        <span className="text-drop-300">pledged</span>
                      )}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-white text-xl font-semibold">
              Invites <span className="text-ink-400">({invites.length})</span>
            </h2>
            <Button size="sm" variant="outline" onClick={() => setShowInvite((v) => !v)}>
              {showInvite ? 'Close' : 'Invite more'}
            </Button>
          </div>
          {showInvite && (
            <div className="mt-3 rounded-xl border border-ink-700 bg-ink-800/70 p-4">
              <Textarea
                value={inviteEmails}
                onChange={(e) => setInviteEmails(e.target.value)}
                placeholder="more@friends.com, family@members.com"
              />
              <div className="mt-3 flex gap-2">
                <Button onClick={onInviteMore} size="sm">
                  Send invites
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowInvite(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {invites.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-ink-600 p-6 text-center text-ink-300 text-sm">
              You haven't invited anyone yet.
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-ink-700 border border-ink-700 rounded-xl overflow-hidden bg-ink-800/60">
              {invites.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="text-white text-sm">{inv.email}</div>
                    <div className="text-xs text-ink-400 mt-0.5">
                      {inv.status}
                      {inv.lastSentAt ? ` · sent ${new Date(inv.lastSentAt).toLocaleDateString()}` : ''}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => onNudge(inv.email)}>
                    Nudge
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
