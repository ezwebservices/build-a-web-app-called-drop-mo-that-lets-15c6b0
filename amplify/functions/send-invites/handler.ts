import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import type { Handler } from 'aws-lambda';

type EmailKind = 'invite' | 'organizerConfirm' | 'pledgeConfirm';

type Event = {
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
  emails: string[];
};

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
    <h1 style="font-size:28px;margin:16px 0;">${event.organizerName} is rallying the group for ${event.recipientFirstName}.</h1>
    <p style="line-height:1.6;color:#c7cbd6;white-space:pre-line;">${event.personalNote || event.story}</p>
    <img src="${imageUrl}" alt="Progress" style="width:100%;border-radius:16px;margin:16px 0;" />
    <p style="color:#c7cbd6;">Drop day: <strong>${new Date(event.dropAtIso).toLocaleString()}</strong>${goal ? ` · Goal: <strong>${goal}</strong>` : ''}</p>
    <a href="${dropUrl}" style="display:inline-block;background:#ff4714;color:#fff;padding:14px 24px;border-radius:999px;text-decoration:none;font-weight:600;margin-top:16px;">Join the drop</a>
    <p style="color:#6b7186;font-size:12px;margin-top:32px;">${event.recipientFirstName} doesn't know. Let's keep it that way.</p>
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

export const handler: Handler<Event> = async (event) => {
  const from = process.env.SES_FROM_ADDRESS ?? 'drop@example.com';
  const base = process.env.APP_BASE_URL ?? 'https://drop.app';
  const dropUrl = `${base}/d/${event.publicToken}`;
  const imageUrl = `${base}/api/progress/${event.publicToken}.png`;
  const kind: EmailKind = event.kind ?? 'invite';

  const html = kind === 'organizerConfirm'
    ? organizerConfirmHtml(event, dropUrl)
    : inviteHtml(event, dropUrl, imageUrl);
  const subject = subjectFor(kind, event);
  const text = kind === 'organizerConfirm'
    ? `Your drop for ${event.recipientFirstName} is ready. Open: ${dropUrl}`
    : `${event.organizerName} is rallying the group for ${event.recipientFirstName}. Join: ${dropUrl}`;

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
      results.push({ email, ok: false, error: (err as Error).message });
    }
  }
  return { sent: results.filter((r) => r.ok).length, results };
};
