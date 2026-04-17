const KEY = 'drop.session.v1';

export type Session = {
  email: string;
  name: string;
};

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(s: Session | null): void {
  if (s) {
    localStorage.setItem(KEY, JSON.stringify(s));
  } else {
    localStorage.removeItem(KEY);
  }
  window.dispatchEvent(new CustomEvent('drop:session'));
}

export function subscribeSession(fn: () => void): () => void {
  const handler = (): void => fn();
  window.addEventListener('drop:session', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('drop:session', handler);
    window.removeEventListener('storage', handler);
  };
}
