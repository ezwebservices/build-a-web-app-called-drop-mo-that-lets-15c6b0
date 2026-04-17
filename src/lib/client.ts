import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { isAmplifyConfigured } from './amplify';

type Client = ReturnType<typeof generateClient<Schema>>;

let _client: Client | null = null;

export function getClient(): Client | null {
  if (!isAmplifyConfigured()) return null;
  if (!_client) {
    _client = generateClient<Schema>();
  }
  return _client;
}

export function getPublicClient(): Client | null {
  if (!isAmplifyConfigured()) return null;
  return generateClient<Schema>({ authMode: 'apiKey' });
}
