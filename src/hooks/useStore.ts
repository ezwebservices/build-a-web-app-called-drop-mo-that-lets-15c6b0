import { useEffect, useState } from 'react';
import { store } from '../lib/store';

export function useStoreVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => store.subscribe(() => setV((x) => x + 1)), []);
  return v;
}
