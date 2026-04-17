import { useEffect, useState } from 'react';
import { getSession, subscribeSession, type Session } from '../lib/session';

export function useSession(): Session | null {
  const [s, setS] = useState<Session | null>(() => getSession());
  useEffect(() => subscribeSession(() => setS(getSession())), []);
  return s;
}
