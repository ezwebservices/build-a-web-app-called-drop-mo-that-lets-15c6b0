import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendInvites } from '../functions/send-invites/resource';

const schema = a.schema({
  Drop: a
    .model({
      recipientFirstName: a.string().required(),
      recipientVenmoHandle: a.string().required(),
      story: a.string().required(),
      goalAmountCents: a.integer(),
      dropAtIso: a.string().required(),
      timezone: a.string().required(),
      personalNote: a.string(),
      inviteSubject: a.string(),
      status: a.enum(['draft', 'scheduled', 'dropped', 'cancelled']),
      publicToken: a.string().required(),
      organizerName: a.string(),
      organizerEmail: a.string(),
      pledges: a.hasMany('Pledge', 'dropId'),
      invites: a.hasMany('Invite', 'dropId'),
    })
    .secondaryIndexes((index) => [index('publicToken')])
    .authorization((allow) => [
      allow.publicApiKey(),
      allow.authenticated(),
    ]),

  Pledge: a
    .model({
      dropId: a.id().required(),
      drop: a.belongsTo('Drop', 'dropId'),
      contributorName: a.string().required(),
      contributorEmail: a.string().required(),
      anonymous: a.boolean().default(false),
      amountCents: a.integer().required(),
      note: a.string(),
      status: a.enum(['pledged', 'sent', 'skipped']),
      pledgeToken: a.string().required(),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
      allow.authenticated(),
    ]),

  Invite: a
    .model({
      dropId: a.id().required(),
      drop: a.belongsTo('Drop', 'dropId'),
      email: a.string().required(),
      status: a.enum(['pending', 'sent', 'opened', 'pledged', 'bounced']),
      lastSentAt: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey(),
      allow.authenticated(),
    ]),

  sendDropEmails: a
    .mutation()
    .arguments({
      kind: a.string().required(),
      dropId: a.string().required(),
      publicToken: a.string().required(),
      recipientFirstName: a.string().required(),
      organizerName: a.string().required(),
      organizerEmail: a.string(),
      inviteSubject: a.string().required(),
      personalNote: a.string().required(),
      story: a.string().required(),
      dropAtIso: a.string().required(),
      goalAmountCents: a.integer(),
      emails: a.string().array().required(),
    })
    .returns(a.json())
    .handler(a.handler.function(sendInvites))
    .authorization((allow) => [allow.authenticated(), allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
