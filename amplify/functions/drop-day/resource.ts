import { defineFunction, secret } from '@aws-amplify/backend';

export const dropDay = defineFunction({
  name: 'drop-day',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 120,
  environment: {
    SES_FROM_ADDRESS: secret('SES_FROM_ADDRESS'),
    APP_BASE_URL: secret('APP_BASE_URL'),
  },
});
