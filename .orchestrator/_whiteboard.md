# Iteration Whiteboard

**Change request:** confirm that everything in this app that needs to persists to dynamodb and live auth sessions. no local storage should be used

**Subtasks planned:** 3

1. **Architect**: Audit the entire codebase (src/ and amplify/) for any use of localStorage, sessionStorage, IndexedDB, or in-memory caches that hold persistent app data (drops, pledges, invites, user profile, draft form state that should survive). Also verify auth state is read from Amplify Auth (fetchAuthSession/getCurrentUser / <Authenticator>) rather than any cached token in localStorage that the app reads directly. Note: Amplify/Cognito internally uses localStorage for token storage — that is expected and OK; flag only app-level reads/writes. Produce a written report at .orchestrator/_persistence_audit.md listing every finding with file:line, what it stores, and whether it should move to DynamoDB (via Amplify Data models) or to live auth session. If everything is already clean, state that explicitly.
2. **Engineer**: Read .orchestrator/_persistence_audit.md. For every violation the Architect flagged, replace it with the correct persistence path: DynamoDB through Amplify Data client (generateClient<Schema>()) for domain data, and live auth via fetchAuthSession()/getCurrentUser() for the signed-in user. Remove any localStorage.getItem/setItem and sessionStorage calls used for app data. If the audit reports the codebase is already clean, make no code changes. Run npm run build until it exits 0.
3. **QA**: Verify by grep that no src/**/*.{ts,tsx} file contains localStorage, sessionStorage, or indexedDB references outside of Amplify/Cognito internal code. Confirm all drop/pledge/invite data flows through the Amplify Data client and that auth-gated UI uses live session hooks. Report pass/fail with file:line evidence.

---

