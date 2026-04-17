import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { isAmplifyConfigured } from './amplify';
import { generateToken } from './utils';
import type {
  CreateDropInput,
  DropRecord,
  DropStatus,
  InviteRecord,
  InviteStatus,
  PledgeRecord,
  PledgeStatus,
} from './types';

type AmplifyClient = ReturnType<typeof generateClient<Schema>>;

function apiClient(): AmplifyClient {
  if (!isAmplifyConfigured()) {
    throw new Error(
      'The Drop backend is not configured yet. Deploy the Amplify backend to persist data.'
    );
  }
  return generateClient<Schema>({ authMode: 'apiKey' });
}

type RemoteDrop = {
  id: string;
  recipientFirstName: string;
  recipientVenmoHandle: string;
  story: string;
  goalAmountCents?: number | null;
  dropAtIso: string;
  timezone: string;
  personalNote?: string | null;
  inviteSubject?: string | null;
  status?: DropStatus | null;
  publicToken: string;
  organizerName?: string | null;
  organizerEmail?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function toDrop(r: RemoteDrop): DropRecord {
  return {
    id: r.id,
    recipientFirstName: r.recipientFirstName,
    recipientVenmoHandle: r.recipientVenmoHandle,
    story: r.story,
    goalAmountCents: r.goalAmountCents ?? null,
    dropAtIso: r.dropAtIso,
    timezone: r.timezone,
    personalNote: r.personalNote ?? '',
    inviteSubject: r.inviteSubject ?? '',
    status: (r.status as DropStatus | null) ?? 'draft',
    publicToken: r.publicToken,
    organizerName: r.organizerName ?? '',
    organizerEmail: r.organizerEmail ?? '',
    createdAt: r.createdAt ?? new Date().toISOString(),
    updatedAt: r.updatedAt ?? new Date().toISOString(),
  };
}

type RemotePledge = {
  id: string;
  dropId: string;
  contributorName: string;
  contributorEmail: string;
  anonymous?: boolean | null;
  amountCents: number;
  note?: string | null;
  status?: PledgeStatus | null;
  pledgeToken: string;
  createdAt?: string | null;
};

function toPledge(r: RemotePledge): PledgeRecord {
  return {
    id: r.id,
    dropId: r.dropId,
    contributorName: r.contributorName,
    contributorEmail: r.contributorEmail,
    anonymous: r.anonymous ?? false,
    amountCents: r.amountCents,
    note: r.note ?? '',
    status: (r.status as PledgeStatus | null) ?? 'pledged',
    pledgeToken: r.pledgeToken,
    createdAt: r.createdAt ?? new Date().toISOString(),
  };
}

type RemoteInvite = {
  id: string;
  dropId: string;
  email: string;
  status?: InviteStatus | null;
  lastSentAt?: string | null;
};

function toInvite(r: RemoteInvite): InviteRecord {
  return {
    id: r.id,
    dropId: r.dropId,
    email: r.email,
    status: (r.status as InviteStatus | null) ?? 'pending',
    lastSentAt: r.lastSentAt ?? null,
  };
}

function explain(errors: readonly { message: string }[] | undefined, fallback: string): string {
  if (errors && errors.length > 0) return errors.map((e) => e.message).join(', ');
  return fallback;
}

export async function createDrop(input: CreateDropInput): Promise<DropRecord> {
  const c = apiClient();
  const publicToken = generateToken(24);
  const { data, errors } = await c.models.Drop.create({
    recipientFirstName: input.recipientFirstName,
    recipientVenmoHandle: input.recipientVenmoHandle,
    story: input.story,
    goalAmountCents: input.goalAmountCents ?? undefined,
    dropAtIso: input.dropAtIso,
    timezone: input.timezone,
    personalNote: input.personalNote,
    inviteSubject: input.inviteSubject,
    status: 'draft',
    publicToken,
    organizerName: input.organizerName,
    organizerEmail: input.organizerEmail,
  });
  if (!data) throw new Error(explain(errors, "Couldn't create the drop."));
  return toDrop(data as unknown as RemoteDrop);
}

export async function updateDrop(
  id: string,
  patch: Partial<Omit<DropRecord, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<DropRecord> {
  const c = apiClient();
  const { data, errors } = await c.models.Drop.update({
    id,
    ...patch,
    goalAmountCents: patch.goalAmountCents === null ? null : patch.goalAmountCents,
  });
  if (!data) throw new Error(explain(errors, "Couldn't update the drop."));
  return toDrop(data as unknown as RemoteDrop);
}

export async function getDrop(id: string): Promise<DropRecord | null> {
  const c = apiClient();
  const { data } = await c.models.Drop.get({ id });
  return data ? toDrop(data as unknown as RemoteDrop) : null;
}

export async function getDropByToken(token: string): Promise<DropRecord | null> {
  const c = apiClient();
  const { data } = await c.models.Drop.list({
    filter: { publicToken: { eq: token } },
    limit: 1,
  });
  const item = data?.[0];
  return item ? toDrop(item as unknown as RemoteDrop) : null;
}

export async function listDropsByOrganizer(email: string): Promise<DropRecord[]> {
  const c = apiClient();
  const { data } = await c.models.Drop.list({
    filter: { organizerEmail: { eq: email } },
  });
  return (data ?? [])
    .map((d) => toDrop(d as unknown as RemoteDrop))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addPledge(
  input: Omit<PledgeRecord, 'id' | 'pledgeToken' | 'createdAt' | 'status'> & {
    status?: PledgeStatus;
  }
): Promise<PledgeRecord> {
  const c = apiClient();
  const pledgeToken = generateToken(24);
  const { data, errors } = await c.models.Pledge.create({
    dropId: input.dropId,
    contributorName: input.contributorName,
    contributorEmail: input.contributorEmail,
    anonymous: input.anonymous,
    amountCents: input.amountCents,
    note: input.note,
    status: input.status ?? 'pledged',
    pledgeToken,
  });
  if (!data) throw new Error(explain(errors, "Couldn't save your pledge."));
  const matching = await c.models.Invite.list({
    filter: {
      dropId: { eq: input.dropId },
      email: { eq: input.contributorEmail },
    },
    limit: 1,
  });
  const inv = matching.data?.[0];
  if (inv) {
    await c.models.Invite.update({ id: inv.id, status: 'pledged' });
  }
  return toPledge(data as unknown as RemotePledge);
}

export async function updatePledgeStatus(id: string, status: PledgeStatus): Promise<PledgeRecord> {
  const c = apiClient();
  const { data, errors } = await c.models.Pledge.update({ id, status });
  if (!data) throw new Error(explain(errors, "Couldn't update the pledge."));
  return toPledge(data as unknown as RemotePledge);
}

export async function getPledgeByToken(token: string): Promise<PledgeRecord | null> {
  const c = apiClient();
  const { data } = await c.models.Pledge.list({
    filter: { pledgeToken: { eq: token } },
    limit: 1,
  });
  const item = data?.[0];
  return item ? toPledge(item as unknown as RemotePledge) : null;
}

export async function listPledgesByDrop(dropId: string): Promise<PledgeRecord[]> {
  const c = apiClient();
  const { data } = await c.models.Pledge.list({
    filter: { dropId: { eq: dropId } },
  });
  return (data ?? [])
    .map((p) => toPledge(p as unknown as RemotePledge))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function addInvites(dropId: string, emails: string[]): Promise<InviteRecord[]> {
  const c = apiClient();
  const existing = await c.models.Invite.list({ filter: { dropId: { eq: dropId } } });
  const seen = new Set((existing.data ?? []).map((i) => i.email));
  const created: InviteRecord[] = [];
  for (const email of emails) {
    if (seen.has(email)) continue;
    const { data } = await c.models.Invite.create({
      dropId,
      email,
      status: 'pending',
    });
    if (data) created.push(toInvite(data as unknown as RemoteInvite));
  }
  return created;
}

export async function markInviteResent(dropId: string, email: string): Promise<void> {
  const c = apiClient();
  const { data } = await c.models.Invite.list({
    filter: { dropId: { eq: dropId }, email: { eq: email } },
    limit: 1,
  });
  const inv = data?.[0];
  if (!inv) return;
  const nextStatus: InviteStatus = inv.status === 'pledged' ? 'pledged' : 'sent';
  await c.models.Invite.update({
    id: inv.id,
    status: nextStatus,
    lastSentAt: new Date().toISOString(),
  });
}

export async function listInvitesByDrop(dropId: string): Promise<InviteRecord[]> {
  const c = apiClient();
  const { data } = await c.models.Invite.list({
    filter: { dropId: { eq: dropId } },
  });
  return (data ?? [])
    .map((i) => toInvite(i as unknown as RemoteInvite))
    .sort((a, b) => a.email.localeCompare(b.email));
}
