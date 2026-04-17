import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile'],
        attributeMapping: {
          email: 'email',
        },
      },
      callbackUrls: ['http://localhost:5173/', 'https://drop.app/'],
      logoutUrls: ['http://localhost:5173/', 'https://drop.app/'],
    },
  },
  userAttributes: {
    email: { required: true },
    preferredUsername: { required: false, mutable: true },
  },
});
