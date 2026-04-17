import { defineFunction } from '@aws-amplify/backend';

export const publicShare = defineFunction({
  name: 'public-share',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 15,
  memoryMB: 1024,
  environment: {
    GRAPHQL_ENDPOINT: '',
    API_KEY: '',
    APP_BASE_URL: '',
  },
});
