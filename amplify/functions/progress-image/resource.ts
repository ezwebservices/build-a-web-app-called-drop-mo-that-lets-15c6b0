import { defineFunction } from '@aws-amplify/backend';

export const progressImage = defineFunction({
  name: 'progress-image',
  entry: './handler.ts',
  timeoutSeconds: 15,
  memoryMB: 1024,
});
