import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Field, Input, Textarea } from '../components/ui/Input';
import { useSessionState } from '../hooks/useSession';
import { createDrop } from '../lib/data';
import { sendDropEmails } from '../lib/email';
import {
  getBrowserTimezone,
  parseDollarsToCents,
  stripVenmoHandle,
} from '../lib/utils';

function defaultDropDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(9, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export function NewDropPage(): React.ReactElement {
  const nav = useNavigate();
  const { session, loading } = useSessionState();
  const [firstName, setFirstName] = useState('');
  const [venmo, setVenmo] = useState('');
  const [story, setStory] = useState('');
  const [goal, setGoal] = useState('');
  const [dropAt, setDropAt] = useState(defaultDropDate());
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [warning, setWarning] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <p className="text-ink-300">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-xl mx-auto px-5 py-24 text-center">
        <h1 className="font-display text-5xl text-white">First — make an account</h1>
        <p className="text-ink-300 mt-3">
          Organizers need an account so you can come back and manage the drop. Takes a second.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Button onClick={() => nav('/login?mode=signUp')}>Create account</Button>
          <Button variant="outline" onClick={() => nav('/login')}>
            I already have one
          </Button>
        </div>
      </div>
    );
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    setWarning('');
    if (!firstName.trim()) {
      setErr("What's the recipient's first name?");
      return;
    }
    const handle = stripVenmoHandle(venmo);
    if (!handle) {
      setErr('Add their Venmo handle.');
      return;
    }
    if (!story.trim()) {
      setErr('Write a sentence or two about what happened.');
      return;
    }
    setSubmitting(true);
    try {
      const cents = goal ? parseDollarsToCents(goal) : 0;
      const drop = await createDrop({
        recipientFirstName: firstName.trim(),
        recipientVenmoHandle: handle,
        story: story.trim(),
        goalAmountCents: cents || null,
        dropAtIso: new Date(dropAt).toISOString(),
        timezone: getBrowserTimezone(),
        personalNote: note.trim(),
        inviteSubject: `A surprise for ${firstName.trim()} — are you in?`,
        organizerName: session!.name,
        organizerEmail: session!.email,
      });
      const result = await sendDropEmails('organizerConfirm', drop, [session!.email]);
      if (!result.ok) {
        setWarning(`Drop saved, but the confirmation email didn't go out: ${result.error}`);
      }
      nav(`/drops/${drop.id}/review`);
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 pt-10 pb-24">
      <div className="text-xs uppercase tracking-wider text-drop-300 mb-2">Step 1 of 3</div>
      <h1 className="font-display text-5xl text-white">Start a drop</h1>
      <p className="text-ink-300 mt-2 max-w-xl">
        Details stay private. The recipient will never see this page or know it existed.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <Field label="Recipient first name" hint="Just first name — keeps things feeling personal.">
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Maya"
            autoFocus
          />
        </Field>
        <Field label="Their Venmo handle" hint="Paste it however — we'll clean up the @.">
          <div className="flex">
            <span className="inline-flex items-center px-4 rounded-l-xl bg-ink-700 border border-r-0 border-ink-600 text-ink-300">
              @
            </span>
            <Input
              value={venmo}
              onChange={(e) => setVenmo(stripVenmoHandle(e.target.value))}
              placeholder="maya-rivera"
              className="rounded-l-none"
            />
          </div>
        </Field>
        <Field
          label="Their story"
          hint="What happened, in your words. Group-chat voice, not charity-website voice. Markdown works."
        >
          <Textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder={
              "Maya's basement flooded last week and the insurance won't cover the pump or the drywall. She's been shoveling mud instead of sleeping. Let's help her breathe."
            }
            className="min-h-[160px]"
          />
        </Field>
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Goal" optional hint="Optional — we'll just show total raised if you skip.">
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-xl bg-ink-700 border border-r-0 border-ink-600 text-ink-300">
                $
              </span>
              <Input
                inputMode="numeric"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="2000"
                className="rounded-l-none"
              />
            </div>
          </Field>
          <Field label="Drop day & time" hint={`Timezone: ${getBrowserTimezone()}`}>
            <Input
              type="datetime-local"
              value={dropAt}
              onChange={(e) => setDropAt(e.target.value)}
            />
          </Field>
        </div>
        <Field
          label="Personal note for the invite email"
          optional
          hint="Read at the top of the email. Leave blank to use a default."
        >
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Hey — pulling this together quietly for Maya. Would love to have you in on it."
          />
        </Field>
        {err && <p className="text-sm text-drop-300">{err}</p>}
        {warning && <p className="text-sm text-amber-300">{warning}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? 'Saving…' : 'Review the invite →'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => nav('/dashboard')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
