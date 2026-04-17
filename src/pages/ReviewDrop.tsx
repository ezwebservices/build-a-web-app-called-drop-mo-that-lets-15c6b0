import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Field, Input, Textarea } from '../components/ui/Input';
import { EmailPreview } from '../components/EmailPreview';
import { addInvites, getDrop, markInviteResent, updateDrop } from '../lib/data';
import { parseEmailList } from '../lib/utils';
import { sendDropEmails } from '../lib/email';
import type { DropRecord } from '../lib/types';

export function ReviewDropPage(): React.ReactElement {
  const { id } = useParams();
  const nav = useNavigate();
  const [drop, setDrop] = useState<DropRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [note, setNote] = useState('');
  const [emails, setEmails] = useState('');
  const [err, setErr] = useState('');
  const [warning, setWarning] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await getDrop(id);
        if (cancelled) return;
        setDrop(d);
        if (d) {
          setSubject(d.inviteSubject);
          setNote(d.personalNote);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <p className="text-ink-300">Loading…</p>
      </div>
    );
  }
  if (!drop) return <NotFound />;

  const parsed = parseEmailList(emails);

  async function onSend(): Promise<void> {
    setErr('');
    setWarning('');
    if (parsed.length === 0) {
      setErr('Add at least one email so we have someone to invite.');
      return;
    }
    setSending(true);
    try {
      const updated = await updateDrop(drop!.id, {
        inviteSubject: subject.trim() || drop!.inviteSubject,
        personalNote: note,
        status: 'scheduled',
      });
      await addInvites(drop!.id, parsed);
      const result = await sendDropEmails('invite', updated, parsed);
      if (!result.ok) {
        setErr(`Couldn't send invites: ${result.error}`);
        return;
      }
      await Promise.all(parsed.map((email) => markInviteResent(drop!.id, email)));
      if (result.sent < result.attempted) {
        setWarning(
          `Sent ${result.sent} of ${result.attempted}. Check the dashboard for failures.`
        );
      }
      nav(`/drops/${drop!.id}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 pt-10 pb-24 grid md:grid-cols-5 gap-8">
      <div className="md:col-span-2 space-y-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-drop-300 mb-2">Step 2 of 3</div>
          <h1 className="font-display text-4xl text-white">Review the invite</h1>
          <p className="text-ink-300 text-sm mt-2">
            This is what lands in their inbox. Tweak the subject and note — the live progress image
            updates automatically as people pledge.
          </p>
        </div>
        <Field label="Subject">
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Personal note">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="pt-2">
          <div className="text-xs uppercase tracking-wider text-drop-300 mb-2">Step 3 of 3</div>
          <Field
            label="Who gets the invite?"
            hint="Paste emails separated by commas, spaces, or new lines. We'll dedupe."
          >
            <Textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder={'alex@gmail.com, sam@gmail.com\njess@gmail.com'}
              className="min-h-[140px]"
            />
          </Field>
          {parsed.length > 0 && (
            <div className="mt-2 text-xs text-ink-300">
              Ready to invite <span className="text-white font-semibold">{parsed.length}</span>{' '}
              {parsed.length === 1 ? 'person' : 'people'}.
            </div>
          )}
          {err && <p className="text-sm text-drop-300 mt-2">{err}</p>}
          {warning && <p className="text-sm text-amber-300 mt-2">{warning}</p>}
        </div>
        <div className="flex gap-3 pt-2">
          <Button size="lg" onClick={onSend} disabled={sending}>
            {sending ? 'Sending…' : 'Send the invites'}
          </Button>
          <Button variant="ghost" onClick={() => nav(`/drops/${drop.id}`)}>
            Save as draft
          </Button>
        </div>
      </div>
      <div className="md:col-span-3">
        <EmailPreview drop={{ ...drop, inviteSubject: subject, personalNote: note }} />
      </div>
    </div>
  );
}

function NotFound(): React.ReactElement {
  return (
    <div className="max-w-xl mx-auto px-5 py-24 text-center">
      <h1 className="font-display text-5xl text-white">Drop not found</h1>
      <p className="text-ink-300 mt-3">It may have been cancelled or the link is wrong.</p>
    </div>
  );
}
