import { defineFunction, secret } from '@aws-amplify/backend';

export const scheduleDrop = defineFunction({
  name: 'schedule-drop',
  entry: './handler.ts',
  resourceGroupName: 'data',
  timeoutSeconds: 30,
  environment: {
    SCHEDULER_ROLE_ARN: secret('SCHEDULER_ROLE_ARN'),
    DROP_DAY_LAMBDA_ARN: secret('DROP_DAY_LAMBDA_ARN'),
    REMINDER_LAMBDA_ARN: secret('REMINDER_LAMBDA_ARN'),
  },
});
