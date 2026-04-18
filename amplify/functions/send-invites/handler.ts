import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import type { Handler } from 'aws-lambda';

type EmailKind = 'invite' | 'organizerConfirm' | 'pledgeConfirm';

type EventArgs = {
  kind?: EmailKind;
  dropId: string;
  publicToken: string;
  recipientFirstName: string;
  organizerName: string;
  organizerEmail?: string | null;
  inviteSubject: string;
  personalNote: string;
  story: string;
  dropAtIso: string;
  goalAmountCents?: number | null;
  emails: string[] | string | null | undefined;
};

type Event = Omit<EventArgs, 'emails'> & { emails: string[] };

type IncomingEvent = EventArgs & { arguments?: EventArgs };

function normalizeEmails(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

const ses = new SESv2Client({});

function fmtMoney(cents?: number | null): string {
  if (!cents) return '';
  return `$${(cents / 100).toFixed(0)}`;
}

function inviteHtml(event: Event, dropUrl: string, imageUrl: string): string {
  const goal = fmtMoney(event.goalAmountCents);
  return `<!doctype html>
<html><body style="margin:0;background:#0b0c10;color:#e9ebf1;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="font-family:'Instrument Serif',Georgia,serif;font-size:48px;color:#ff6a3d;">Drop</div>
    <h1 style="font-size:28px;margin:16px 0;">${event.organizerName} is putting together a small surprise for ${event.recipientFirstName}.</h1>
    <p style="line-height:1.6;color:#c7cbd6;white-space:pre-line;">${event.personalNote || event.story}</p>
    <img src="${imageUrl}" alt="Progress" style="width:100%;border-radius:16px;margin:16px 0;" />
    <p style="color:#c7cbd6;">Drop day: <strong>${new Date(event.dropAtIso).toLocaleString()}</strong>${goal ? ` · Goal: <strong>${goal}</strong>` : ''}</p>
    <a href="${dropUrl}" style="display:inline-block;background:#ff4714;color:#fff;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:600;margin-top:16px;">Chip in</a>
    <p style="color:#6b7186;font-size:12px;margin-top:32px;">${event.recipientFirstName} doesn't know — please keep it that way.</p>
  </div>
</body></html>`;
}

function organizerConfirmHtml(event: Event, dropUrl: string): string {
  const goal = fmtMoney(event.goalAmountCents);
  return `<!doctype html>
<html><body style="margin:0;background:#0b0c10;color:#e9ebf1;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="font-family:'Instrument Serif',Georgia,serif;font-size:48px;color:#ff6a3d;">Drop</div>
    <h1 style="font-size:28px;margin:16px 0;">Your drop for ${event.recipientFirstName} is set up.</h1>
    <p style="line-height:1.6;color:#c7cbd6;">Drop day: <strong>${new Date(event.dropAtIso).toLocaleString()}</strong>${goal ? ` · Goal: <strong>${goal}</strong>` : ''}</p>
    <p style="line-height:1.6;color:#c7cbd6;">Next step — review the invite copy and send it to your group. We'll handle the day-before reminder and drop-day timing.</p>
    <a href="${dropUrl}" style="display:inline-block;background:#ff4714;color:#fff;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:600;margin-top:16px;">Open the drop</a>
    <p style="color:#6b7186;font-size:12px;margin-top:32px;">Only people you invite will see the drop page. Keep that link to yourself.</p>
  </div>
</body></html>`;
}

function subjectFor(kind: EmailKind, event: Event): string {
  if (kind === 'organizerConfirm') {
    return `Your drop for ${event.recipientFirstName} is ready`;
  }
  return event.inviteSubject;
}

export const handler: Handler<IncomingEvent> = async (raw) => {
  const args: EventArgs = (raw && raw.arguments ? raw.arguments : raw) as EventArgs;
  const event: Event = { ...args, emails: normalizeEmails(args?.emails) };
  const from = (process.env.SES_FROM_ADDRESS ?? '').trim();
  const base = (process.env.APP_BASE_URL ?? '').trim().replace(/\/+$/, '');
  const kind: EmailKind = event.kind ?? 'invite';

  if (!Array.isArray(event.emails) || event.emails.length === 0) {
    return { sent: 0, results: [], error: 'No recipients provided' };
  }
  if (!from) {
    const msg =
      'SES_FROM_ADDRESS secret is not configured. Set a verified SES identity in Amplify secrets before sending invites.';
    console.error(msg);
    return { sent: 0, results: [], error: msg };
  }
  if (!base) {
    const msg =
      'APP_BASE_URL secret is not configured. Set it to the deployed site URL (e.g. https://main.d1u2km81dncoin.amplifyapp.com).';
    console.error(msg);
    return { sent: 0, results: [], error: msg };
  }
  const shareBase = (process.env.PUBLIC_SHARE_URL ?? '').trim().replace(/\/+$/, '');
  const dropUrl = shareBase
    ? `${shareBase}/s/${event.publicToken}`
    : `${base}/d/${event.publicToken}/`;
  const imageUrl = shareBase
    ? `${shareBase}/og/${event.publicToken}.png`
    : `${base}/api/progress/${event.publicToken}.png`;

  const html = kind === 'organizerConfirm'
    ? organizerConfirmHtml(event, dropUrl)
    : inviteHtml(event, dropUrl, imageUrl);
  const subject = subjectFor(kind, event);
  const text = kind === 'organizerConfirm'
    ? `Your drop for ${event.recipientFirstName} is ready. Open: ${dropUrl}`
    : `${event.organizerName} is putting together a small surprise for ${event.recipientFirstName}. Chip in: ${dropUrl}`;

  const results: Array<{ email: string; ok: boolean; error?: string }> = [];
  for (const email of event.emails) {
    try {
      await ses.send(
        new SendEmailCommand({
          FromEmailAddress: from,
          Destination: { ToAddresses: [email] },
          Content: {
            Simple: {
              Subject: { Data: subject, Charset: 'UTF-8' },
              Body: {
                Html: { Data: html, Charset: 'UTF-8' },
                Text: { Data: text, Charset: 'UTF-8' },
              },
            },
          },
        })
      );
      results.push({ email, ok: true });
    } catch (err) {
      const message = (err as Error).message ?? String(err);
      console.error(`SES send failed for ${email}: ${message}`);
      results.push({ email, ok: false, error: message });
    }
  }
  const sent = results.filter((r) => r.ok).length;
  const failures = results.filter((r) => !r.ok);
  const error =
    sent === 0 && failures.length > 0
      ? failures[0].error ?? 'SES send failed'
      : undefined;
  return { sent, results, error };
};
