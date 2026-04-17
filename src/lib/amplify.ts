import { Amplify } from 'aws-amplify';

let configured = false;
let hasConfig = false;

export function configureAmplify(): void {
  if (configured) return;
  configured = true;
  const modules = import.meta.glob('/amplify_outputs.json', { eager: true }) as Record<
    string,
    { default?: unknown } | unknown
  >;
  const entry = Object.values(modules)[0];
  if (!entry) return;
  const outputs = (entry as { default?: unknown }).default ?? entry;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Amplify.configure(outputs as any);
    hasConfig = true;
  } catch {
    hasConfig = false;
  }
}

export function isAmplifyConfigured(): boolean {
  return hasConfig;
}
