import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType, HttpMethod, Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { sendInvites } from './functions/send-invites/resource';
import { scheduleDrop } from './functions/schedule-drop/resource';
import { progressImage } from './functions/progress-image/resource';
import { dropDay } from './functions/drop-day/resource';
import { publicShare } from './functions/public-share/resource';

const backend = defineBackend({
  auth,
  data,
  sendInvites,
  scheduleDrop,
  progressImage,
  dropDay,
  publicShare,
});

const sesPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: ['*'],
});

backend.sendInvites.resources.lambda.addToRolePolicy(sesPolicy);
backend.dropDay.resources.lambda.addToRolePolicy(sesPolicy);

// Public-share Function URL (unauthenticated): serves /s/:token (HTML w/ OG meta)
// and /og/:token.png (branded SVG preview image).
const publicShareUrl = backend.publicShare.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.GET],
    allowedHeaders: ['*'],
    maxAge: undefined,
  },
});

// Inject GraphQL endpoint + API key so the handler can read Drops/Pledges.
const cfnFn = backend.publicShare.resources.cfnResources.cfnFunction;
const graphqlUrl = backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl;
const apiKey = backend.data.resources.cfnResources.cfnApiKey?.attrApiKey ?? '';
cfnFn.environment = {
  variables: {
    GRAPHQL_ENDPOINT: graphqlUrl,
    API_KEY: apiKey,
    APP_BASE_URL: process.env.APP_BASE_URL ?? '',
  },
};

// Surface the public-share Function URL to send-invites so emails link to the
// share endpoint (which serves per-drop OG meta for iMessage/Slack previews).
(backend.sendInvites.resources.lambda as LambdaFunction).addEnvironment('PUBLIC_SHARE_URL', publicShareUrl.url);

backend.addOutput({
  custom: {
    publicShareUrl: publicShareUrl.url,
  },
});
