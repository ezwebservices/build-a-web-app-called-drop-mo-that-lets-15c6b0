# Iteration Whiteboard

**Change request:** I have this issue when trying to send the email,  is there a free secure way to achioeve this? Couldn't send invites: No federated jwt

**Subtasks planned:** 2

1. **Engineer**: Fix the 'No federated jwt' error when sending invite emails. Investigation + fix:

1. Locate the invite-send code path (likely amplify/functions/send-invite/ or similar, plus the frontend call site in src/ where organizer clicks 'Send invites').
2. Root cause: 'No federated jwt' is thrown by Amplify when a call is made with authMode 'userPool' but no Cognito session exists, OR when a Lambda/resolver expects an identityPool/IAM credential it can't get. Determine which: (a) is the organizer actually signed in at the moment of send? (b) what authorization mode is declared on the mutation/function in amplify/data/resource.ts?
3. Fix approach (free + secure):
   - Ensure the send-invites mutation in amplify/data/resource.ts uses `allow.authenticated()` (Cognito user pool) so only signed-in organizers can trigger it. Do NOT expose it to public/apiKey.
   - In the frontend, pass `{ authMode: 'userPool' }` explicitly to the client.mutations.sendInvites(...) call, and guard the UI so the button is disabled until `useAuthenticator`/`getCurrentUser` resolves a signed-in user.
   - If the organizer is signed in with Google federation, confirm the Cognito User Pool has the Google identity provider wired and that Amplify Auth's `fetchAuthSession()` returns tokens before the mutation is called. If tokens are missing, force a re-auth redirect.
4. Email delivery (free, secure): use Amazon SES via an Amplify Function. SES sandbox is free and sufficient for testing (verify the sender email + any recipient in the sandbox via AWS Console). Production sending is $0.10 per 1k emails — effectively free at this scale. Configure:
   - amplify/functions/send-invite/resource.ts: defineFunction with environment { SES_FROM_ADDRESS: secret('SES_FROM_ADDRESS') }.
   - Grant the function's execution role `ses:SendEmail` on the verified identity (via backend.ts customResources or a resource override).
   - Function handler uses @aws-sdk/client-ses SendEmailCommand with From = verified address, To = contributor, HTML body = branded invite.
5. Do NOT use SMTP/nodemailer with hardcoded creds, do NOT use a third-party free SMTP relay — SES is the free + secure path already in our stack.
6. Add user-facing error handling: if sendInvites throws, surface a toast with the real message (not just 'No federated jwt'); if the user isn't signed in, redirect to /login instead of attempting the call.
7. Run `npm run build` until clean. Verify the mutation signature matches frontend call. Document in a short comment only if the auth flow is non-obvious.

Deliverable: organizer signed in → clicks Send Invites → emails land in contributor inboxes with no 'No federated jwt' error.
2. **QA**: Verify the invite-send flow end-to-end after the Engineer's fix: (1) signed-out organizer clicking Send Invites gets a clean redirect/message, not 'No federated jwt'; (2) signed-in organizer (email/password AND Google federation) successfully triggers invites; (3) SES delivers to a verified sandbox recipient; (4) no auth tokens leak to console/network; (5) mutation rejects unauthenticated requests at the AppSync layer (test by stripping the Authorization header). Report pass/fail per case.

---

