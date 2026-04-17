import { useEffect, useState } from 'react';
import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { isAmplifyConfigured } from '../lib/amplify';

export type Session = {
  email: string;
  name: string;
  userId: string;
};

export type SessionState = {
  session: Session | null;
  loading: boolean;
};

async function readSession(): Promise<Session | null> {
  if (!isAmplifyConfigured()) return null;
  try {
    const user = await getCurrentUser();
    const attrs = await fetchUserAttributes();
    const email = (attrs.email ?? user.signInDetails?.loginId ?? '').toLowerCase();
    const name = attrs.preferredUsername ?? attrs.name ?? email.split('@')[0] ?? 'Friend';
    return { email, name, userId: user.userId };
  } catch {
    return null;
  }
}

export function useSessionState(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const refresh = async (): Promise<void> => {
      const s = await readSession();
      if (!cancelled) {
        setSession(s);
        setLoading(false);
      }
    };
    void refresh();
    const unsub = Hub.listen('auth', ({ payload }) => {
      const event = payload.event;
      if (
        event === 'signedIn' ||
        event === 'signedOut' ||
        event === 'tokenRefresh' ||
        event === 'signInWithRedirect'
      ) {
        void refresh();
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return { session, loading };
}

export function useSession(): Session | null {
  return useSessionState().session;
}
