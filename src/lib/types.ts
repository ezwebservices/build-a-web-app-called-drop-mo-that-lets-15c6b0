export type DropStatus = 'draft' | 'scheduled' | 'dropped' | 'cancelled';
export type PledgeStatus = 'pledged' | 'sent' | 'skipped';
export type InviteStatus = 'pending' | 'sent' | 'opened' | 'pledged' | 'bounced';

export type DropRecord = {
  id: string;
  recipientFirstName: string;
  recipientVenmoHandle: string;
  story: string;
  goalAmountCents: number | null;
  dropAtIso: string;
  timezone: string;
  personalNote: string;
  inviteSubject: string;
  status: DropStatus;
  publicToken: string;
  organizerName: string;
  organizerEmail: string;
  createdAt: string;
  updatedAt: string;
};

export type PledgeRecord = {
  id: string;
  dropId: string;
  contributorName: string;
  contributorEmail: string;
  anonymous: boolean;
  amountCents: number;
  note: string;
  status: PledgeStatus;
  pledgeToken: string;
  createdAt: string;
};

export type InviteRecord = {
  id: string;
  dropId: string;
  email: string;
  status: InviteStatus;
  lastSentAt: string | null;
};

export type CreateDropInput = {
  recipientFirstName: string;
  recipientVenmoHandle: string;
  story: string;
  goalAmountCents: number | null;
  dropAtIso: string;
  timezone: string;
  personalNote: string;
  inviteSubject: string;
  organizerName: string;
  organizerEmail: string;
};
