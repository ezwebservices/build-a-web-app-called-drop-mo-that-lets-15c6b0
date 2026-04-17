import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Field, Input, Textarea } from '../components/ui/Input';
import { ProgressBar } from '../components/ProgressBar';
import { store } from '../lib/store';
import { useStoreVersion } from '../hooks/useStore';
import { formatDropTime, formatMoney, parseEmailList } from '../lib/utils';

export function DropDetailPage(): React.ReactElement {
  const { id } = useParams();
  useStoreVersion();
  const nav = useNavigate();
  const drop = useMemo(() => (id ? store.getDrop(id) : null), [id]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [dropAt, setDropAt] = useState(drop ? drop.dropAtIso.slice(0, 16) : '');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  if (!drop) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-5xl text-white">Drop not found</h1>
      </div>
    );
  }

  const pledges = store.listPledgesByDrop(drop.id);
  const invites = store.listInvitesByDrop(drop.id);
  const raised = pledges.reduce((s, p) => s + p.amountCents, 0);
  const shareUrl = `${window.location.origin}/d/${drop.publicToken}`;

  function onInviteMore(): void {
    const list = parseEmailList(inviteEmails);
    if (list.length === 0) return;
    store.addInvites(drop!.id, list);
    setInviteEmails('');
    setShowInvite(false);
  }

  function onNudge(email: string): void {
    store.markInviteResent(drop!.id, email);
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

  function onPostpone(): void {
    if (!dropAt) return;
    store.updateDrop(drop!.id, { dropAtIso: new Date(dropAt).toISOString() });
    setEditOpen(false);
  }

  function onCancel(): void {
    if (!window.confirm('Cancel this drop? Contributors will stop receiving reminders.')) return;
    store.updateDrop(drop!.id, { status: 'cancelled' });
    nav('/dashboard');
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
