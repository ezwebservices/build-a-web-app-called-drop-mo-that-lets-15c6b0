import { defineFunction, secret } from '@aws-amplify/backend';

export const sendInvites = defineFunction({
  name: 'send-invites',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 60,
  environment: {
    SES_FROM_ADDRESS: secret('SES_FROM_ADDRESS'),
    APP_BASE_URL: secret('APP_BASE_URL'),
  },
});
