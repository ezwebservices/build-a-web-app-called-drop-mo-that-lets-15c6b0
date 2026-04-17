import { getPublicClient } from './client';
import type { DropRecord, DropStatus, PledgeRecord, PledgeStatus } from './store';

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

function toRecord(r: RemoteDrop, owner = ''): DropRecord {
  return {
    id: r.id,
    owner,
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

export async function fetchDropByToken(token: string): Promise<DropRecord | null> {
  const client = getPublicClient();
  if (!client) return null;
  try {
    const res = await client.models.Drop.list({
      filter: { publicToken: { eq: token } },
      limit: 1,
    });
    const item = res.data?.[0];
    if (!item) return null;
    return toRecord(item as unknown as RemoteDrop);
  } catch {
    return null;
  }
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

export async function persistPledge(pledge: PledgeRecord): Promise<void> {
  const client = getPublicClient();
  if (!client) return;
  try {
    await client.models.Pledge.create({
      id: pledge.id,
      dropId: pledge.dropId,
      contributorName: pledge.contributorName,
      contributorEmail: pledge.contributorEmail,
      anonymous: pledge.anonymous,
      amountCents: pledge.amountCents,
      note: pledge.note,
      status: pledge.status,
      pledgeToken: pledge.pledgeToken,
    });
  } catch {
    // Backend not deployed — localStorage still has the pledge.
  }
}

export async function fetchPledgesByDropId(dropId: string): Promise<PledgeRecord[]> {
  const client = getPublicClient();
  if (!client) return [];
  try {
    const res = await client.models.Pledge.list({
      filter: { dropId: { eq: dropId } },
    });
    return (res.data ?? []).map((p) => toPledge(p as unknown as RemotePledge));
  } catch {
    return [];
  }
}

export async function persistDrop(drop: DropRecord): Promise<void> {
  const client = getPublicClient();
  if (!client) return;
  try {
    await client.models.Drop.create({
      id: drop.id,
      recipientFirstName: drop.recipientFirstName,
      recipientVenmoHandle: drop.recipientVenmoHandle,
      story: drop.story,
      goalAmountCents: drop.goalAmountCents ?? undefined,
      dropAtIso: drop.dropAtIso,
      timezone: drop.timezone,
      personalNote: drop.personalNote,
      inviteSubject: drop.inviteSubject,
      status: drop.status,
      publicToken: drop.publicToken,
      organizerName: drop.organizerName,
      organizerEmail: drop.organizerEmail,
    });
  } catch {
    // Backend not deployed yet — fall back silently to localStorage.
  }
}
