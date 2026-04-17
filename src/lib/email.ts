import { getClient, getPublicClient } from './client';
import type { DropRecord } from './store';

export type EmailKind = 'invite' | 'organizerConfirm';

export type SendDropEmailsResult = {
  ok: boolean;
  sent: number;
  attempted: number;
  error?: string;
  skippedReason?: 'not-configured' | 'no-recipients';
};

export async function sendDropEmails(
  kind: EmailKind,
  drop: DropRecord,
  emails: string[]
): Promise<SendDropEmailsResult> {
  const recipients = emails.map((e) => e.trim()).filter(Boolean);
  if (recipients.length === 0) {
    return { ok: true, sent: 0, attempted: 0, skippedReason: 'no-recipients' };
  }
  const client = kind === 'invite' ? getClient() : getClient() ?? getPublicClient();
  if (!client) {
    return {
      ok: false,
      sent: 0,
      attempted: recipients.length,
      skippedReason: 'not-configured',
      error:
        'Email backend is not configured yet. Deploy the Amplify backend so SES can send these.',
    };
  }
  try {
    const response = await client.mutations.sendDropEmails({
      kind,
      dropId: drop.id,
      publicToken: drop.publicToken,
      recipientFirstName: drop.recipientFirstName,
      organizerName: drop.organizerName,
      organizerEmail: drop.organizerEmail,
      inviteSubject: drop.inviteSubject,
      personalNote: drop.personalNote,
      story: drop.story,
      dropAtIso: drop.dropAtIso,
      goalAmountCents: drop.goalAmountCents,
      emails: recipients,
    });
    if (response.errors && response.errors.length > 0) {
      return {
        ok: false,
        sent: 0,
        attempted: recipients.length,
        error: response.errors.map((e) => e.message).join(', '),
      };
    }
    const data = response.data as { sent?: number } | null;
    const sent = data?.sent ?? recipients.length;
    return { ok: true, sent, attempted: recipients.length };
  } catch (err) {
    return {
      ok: false,
      sent: 0,
      attempted: recipients.length,
      error: (err as Error).message,
    };
  }
}
