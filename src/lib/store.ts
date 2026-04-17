import { generateToken } from './utils';

export type DropStatus = 'draft' | 'scheduled' | 'dropped' | 'cancelled';
export type PledgeStatus = 'pledged' | 'sent' | 'skipped';
export type InviteStatus = 'pending' | 'sent' | 'opened' | 'pledged' | 'bounced';

export type DropRecord = {
  id: string;
  owner: string;
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

type StoreShape = {
  drops: DropRecord[];
  pledges: PledgeRecord[];
  invites: InviteRecord[];
};

const KEY = 'drop.store.v1';

function read(): StoreShape {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { drops: [], pledges: [], invites: [] };
    return JSON.parse(raw) as StoreShape;
  } catch {
    return { drops: [], pledges: [], invites: [] };
  }
}

function write(s: StoreShape): void {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent('drop:store'));
}

export type CreateDropInput = Omit<
  DropRecord,
  'id' | 'publicToken' | 'status' | 'createdAt' | 'updatedAt'
>;

export const store = {
  createDrop(input: CreateDropInput): DropRecord {
    const now = new Date().toISOString();
    const record: DropRecord = {
      id: generateToken(16),
      publicToken: generateToken(24),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    const s = read();
    s.drops.push(record);
    write(s);
    return record;
  },
  updateDrop(id: string, patch: Partial<DropRecord>): DropRecord | null {
    const s = read();
    const idx = s.drops.findIndex((d) => d.id === id);
    if (idx < 0) return null;
    s.drops[idx] = { ...s.drops[idx], ...patch, updatedAt: new Date().toISOString() };
    write(s);
    return s.drops[idx];
  },
  deleteDrop(id: string): void {
    const s = read();
    s.drops = s.drops.filter((d) => d.id !== id);
    s.pledges = s.pledges.filter((p) => p.dropId !== id);
    s.invites = s.invites.filter((i) => i.dropId !== id);
    write(s);
  },
  getDrop(id: string): DropRecord | null {
    return read().drops.find((d) => d.id === id) ?? null;
  },
  getDropByToken(token: string): DropRecord | null {
    return read().drops.find((d) => d.publicToken === token) ?? null;
  },
  listDropsByOwner(owner: string): DropRecord[] {
    return read()
      .drops.filter((d) => d.owner === owner)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  addPledge(
    input: Omit<PledgeRecord, 'id' | 'pledgeToken' | 'createdAt' | 'status'> & {
      status?: PledgeStatus;
    }
  ): PledgeRecord {
    const record: PledgeRecord = {
      id: generateToken(16),
      pledgeToken: generateToken(24),
      createdAt: new Date().toISOString(),
      status: input.status ?? 'pledged',
      ...input,
    };
    const s = read();
    s.pledges.push(record);
    const matching = s.invites.find(
      (inv) => inv.dropId === input.dropId && inv.email === input.contributorEmail
    );
    if (matching) matching.status = 'pledged';
    write(s);
    return record;
  },
  updatePledge(id: string, patch: Partial<PledgeRecord>): PledgeRecord | null {
    const s = read();
    const idx = s.pledges.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    s.pledges[idx] = { ...s.pledges[idx], ...patch };
    write(s);
    return s.pledges[idx];
  },
  getPledgeByToken(token: string): PledgeRecord | null {
    return read().pledges.find((p) => p.pledgeToken === token) ?? null;
  },
  mergePledges(records: PledgeRecord[]): void {
    const s = read();
    const existing = new Set(s.pledges.map((p) => p.id));
    let changed = false;
    for (const r of records) {
      if (existing.has(r.id)) continue;
      s.pledges.push(r);
      existing.add(r.id);
      changed = true;
    }
    if (changed) write(s);
  },
  listPledgesByDrop(dropId: string): PledgeRecord[] {
    return read()
      .pledges.filter((p) => p.dropId === dropId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  addInvites(dropId: string, emails: string[]): InviteRecord[] {
    const s = read();
    const existing = new Set(
      s.invites.filter((i) => i.dropId === dropId).map((i) => i.email)
    );
    const created: InviteRecord[] = [];
    for (const email of emails) {
      if (existing.has(email)) continue;
      const rec: InviteRecord = {
        id: generateToken(16),
        dropId,
        email,
        status: 'pending',
        lastSentAt: null,
      };
      s.invites.push(rec);
      created.push(rec);
    }
    write(s);
    return created;
  },
  markInviteResent(dropId: string, email: string): void {
    const s = read();
    const inv = s.invites.find((i) => i.dropId === dropId && i.email === email);
    if (inv) {
      inv.lastSentAt = new Date().toISOString();
      inv.status = inv.status === 'pledged' ? 'pledged' : 'sent';
    }
    write(s);
  },
  listInvitesByDrop(dropId: string): InviteRecord[] {
    return read()
      .invites.filter((i) => i.dropId === dropId)
      .sort((a, b) => a.email.localeCompare(b.email));
  },
  subscribe(fn: () => void): () => void {
    const handler = (): void => fn();
    window.addEventListener('drop:store', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('drop:store', handler);
      window.removeEventListener('storage', handler);
    };
  },
};
