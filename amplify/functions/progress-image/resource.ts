import { defineFunction } from '@aws-amplify/backend';

export const progressImage = defineFunction({
  name: 'progress-image',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 15,
  memoryMB: 1024,
});
