import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendInvites } from './functions/send-invites/resource';
import { scheduleDrop } from './functions/schedule-drop/resource';
import { progressImage } from './functions/progress-image/resource';
import { dropDay } from './functions/drop-day/resource';

const backend = defineBackend({
  auth,
  data,
  sendInvites,
  scheduleDrop,
  progressImage,
  dropDay,
});

const sesPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: ['*'],
});

backend.sendInvites.resources.lambda.addToRolePolicy(sesPolicy);
backend.dropDay.resources.lambda.addToRolePolicy(sesPolicy);
