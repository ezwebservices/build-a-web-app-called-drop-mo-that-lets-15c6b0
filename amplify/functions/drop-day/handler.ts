import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import type { Handler } from 'aws-lambda';

type Pledge = {
  id: string;
  contributorName: string;
  contributorEmail: string;
  amountCents: number;
  note?: string | null;
  pledgeToken: string;
};

type Event = {
  dropId: string;
  kind: 'reminder' | 'dropday';
  recipientFirstName: string;
  recipientVenmoHandle: string;
  publicToken: string;
  pledges: Pledge[];
};

const ses = new SESv2Client({});

function venmoLink(handle: string, amountCents: number, note: string): string {
  const amt = (amountCents / 100).toFixed(2);
  const p = new URLSearchParams({
    txn: 'pay',
    audience: 'private',
    recipients: handle.replace(/^@/, ''),
    amount: amt,
    note,
  });
  return `https://venmo.com/?${p.toString()}`;
}

export const handler: Handler<Event> = async (event) => {
  const from = process.env.SES_FROM_ADDRESS ?? 'drop@example.com';
  const base = process.env.APP_BASE_URL ?? 'https://drop.app';

  for (const p of event.pledges) {
    const amount = `$${(p.amountCents / 100).toFixed(0)}`;
    const note = p.note?.trim() || `For ${event.recipientFirstName} ❤️`;
    const markSentUrl = `${base}/p/${p.pledgeToken}?sent=1`;

    const subject =
      event.kind === 'reminder'
        ? `Tomorrow's the day for ${event.recipientFirstName}`
        : `Time to send ${amount} to ${event.recipientFirstName}`;

    const html = `<!doctype html><html><body style="margin:0;background:#0b0c10;color:#e9ebf1;font-family:Inter,Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;">
  <div style="font-family:'Instrument Serif',Georgia,serif;font-size:48px;color:#ff6a3d;">Drop</div>
  <h1 style="font-size:28px;">${event.kind === 'reminder' ? `Tomorrow's the day.` : `Today's the day.`}</h1>
  <p style="line-height:1.6;color:#c7cbd6;">
    ${event.kind === 'reminder'
      ? `Heads up — tomorrow at the scheduled time, you'll send ${amount} to ${event.recipientFirstName}.`
      : `Tap the button to send <strong>${amount}</strong> to ${event.recipientFirstName} on Venmo. Everyone's sending right around now.`}
  </p>
  ${event.kind === 'dropday'
    ? `<a href="${venmoLink(event.recipientVenmoHandle, p.amountCents, note)}" style="display:inline-block;background:#ff4714;color:#fff;padding:16px 28px;border-radius:999px;text-decoration:none;font-weight:700;">Send ${amount} on Venmo</a>
       <p style="margin-top:24px;"><a href="${markSentUrl}" style="color:#ff9975;">I sent it →</a></p>`
    : ''}
  <p style="color:#6b7186;font-size:12px;margin-top:32px;">Please keep it a surprise — don't mention it to ${event.recipientFirstName}.</p>
</div></body></html>`;

    try {
      await ses.send(
        new SendEmailCommand({
          FromEmailAddress: from,
          Destination: { ToAddresses: [p.contributorEmail] },
          Content: {
            Simple: {
              Subject: { Data: subject, Charset: 'UTF-8' },
              Body: { Html: { Data: html, Charset: 'UTF-8' } },
            },
          },
        })
      );
    } catch {
      // continue with the rest
    }
  }
  return { ok: true, count: event.pledges.length };
};
