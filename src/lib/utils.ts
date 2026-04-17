import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatMoney(cents: number | null | undefined): string {
  const v = (cents ?? 0) / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);
}

export function parseDollarsToCents(value: string): number {
  const n = Number(value.replace(/[^0-9.]/g, ''));
  if (!isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

export function generateToken(length = 28): string {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export function stripVenmoHandle(value: string): string {
  return value.trim().replace(/^@+/, '').replace(/\s+/g, '');
}

export function venmoDeepLink(handle: string, amountCents: number, note: string): string {
  const params = new URLSearchParams({
    txn: 'pay',
    audience: 'private',
    recipients: stripVenmoHandle(handle),
    amount: (amountCents / 100).toFixed(2),
    note,
  });
  return `https://venmo.com/?${params.toString()}`;
}

export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'America/New_York';
  }
}

export function formatDropTime(iso: string, tz?: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: tz,
    });
  } catch {
    return iso;
  }
}

export function parseEmailList(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  );
}

export function countdown(toIso: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
} {
  const diff = new Date(toIso).getTime() - Date.now();
  const totalMs = Math.max(0, diff);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);
  return { days, hours, minutes, seconds, totalMs };
}
