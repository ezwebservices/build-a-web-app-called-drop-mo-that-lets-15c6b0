# Drop — Persistence Audit

**Date:** 2026-04-17
**Scope:** `src/` and `amplify/` — all reads/writes of `localStorage`, `sessionStorage`, `IndexedDB`, and in-memory caches holding persistent app data; verification that auth state is sourced from Amplify Auth rather than an app-level cached token.

**Verdict:** ❌ **NOT CLEAN.** The app currently persists *all* domain data (drops, pledges, invites) and the entire user session to `localStorage`. Amplify Data (DynamoDB via AppSync) exists and the schema is defined, but the frontend treats DynamoDB as a best-effort secondary sink — `localStorage` is the source of truth. Amplify Auth (Cognito) is **not wired to the UI at all**: there is no `<Authenticator>`, `fetchAuthSession`, or `getCurrentUser` call anywhere in `src/`. The Login page writes a plain object `{ email, name }` into `localStorage` and that object is what the app treats as "the signed-in user."

A one-file code deletion will not fix this — every page that reads `store.*` or `getSession()` needs to be rewired. The safe move is a dedicated refactor PR. This audit enumerates the findings so that work can be scoped.

---

## Findings

### 1. `src/lib/session.ts` — app-level auth session in localStorage 🔴 CRITICAL

| Line | Code | What it stores |
|---|---|---|
| `src/lib/session.ts:10` | `localStorage.getItem(KEY)` | Reads `{ email, name }` representing "the signed-in organizer" |
| `src/lib/session.ts:20` | `localStorage.setItem(KEY, JSON.stringify(s))` | Writes the same object on login |
| `src/lib/session.ts:22` | `localStorage.removeItem(KEY)` | Clears it on logout |

**Disposition: Move to live auth session (Amplify Auth).**

This is the explicit case the audit was asked to flag: the app is reading its own cached "who is logged in" record, not Cognito. The Login page (`src/pages/Login.tsx:45`, `:54`) does not call `signIn` / `signUp` / `signInWithRedirect` from `aws-amplify/auth` at all — it just stuffs form values into `localStorage` and navigates to `/dashboard`. The Google button (`:52-56`) is a placebo.

**Required replacement:**
- Wrap the authenticated routes in `<Authenticator>` from `@aws-amplify/ui-react`, or call `signIn({ username, password })` / `signUp(...)` / `signInWithRedirect({ provider: 'Google' })` from `aws-amplify/auth` in `Login.tsx`.
- Replace `getSession()` with `await getCurrentUser()` + `fetchUserAttributes()` (for the display name) and `await fetchAuthSession()` (for the JWT when calling APIs).
- Replace the `useSession()` hook (`src/hooks/useSession.ts`) with a hook that subscribes to Hub `auth` events (`Hub.listen('auth', ...)`) and re-runs `getCurrentUser()`.
- `preferredUsername` is already declared mutable in `amplify/auth/resource.ts:9` — use it to hold the organizer's display name instead of a parallel `name` field.
- To enable Google, add `externalProviders: { google: { clientId: secret(...), clientSecret: secret(...), scopes: [...] }, callbackUrls: [...], logoutUrls: [...] }` to `defineAuth`.

**Callers that must be rewritten:**
- `src/pages/Login.tsx:45, :54` — replace `setSession(...)` with real Cognito `signIn` / `signUp` / `signInWithRedirect`.
- `src/components/Nav.tsx:5` — replace `setSession(null)` with `signOut()`.
- `src/hooks/useSession.ts:2` — rewrite on top of `getCurrentUser` + Hub.
- Any page that calls `useSession()` (Dashboard, NewDrop, ReviewDrop, DropDetail) — unchanged at call site if the hook signature is kept, but must handle the async load state.

**Note on Cognito's own localStorage use:** Amplify internally persists Cognito tokens in `localStorage` under keys like `CognitoIdentityServiceProvider.*`. That is expected and explicitly out of scope — the fix is to stop *the app* from reading a parallel session blob.

---

### 2. `src/lib/store.ts` — entire domain model in localStorage 🔴 CRITICAL

| Line | Code | What it stores |
|---|---|---|
| `src/lib/store.ts:53` | `const KEY = 'drop.store.v1'` | Single localStorage key holding the whole app state |
| `src/lib/store.ts:57` | `localStorage.getItem(KEY)` | Reads `{ drops, pledges, invites }` |
| `src/lib/store.ts:66` | `localStorage.setItem(KEY, JSON.stringify(s))` | Writes on every mutation |

The `store` object exposes `createDrop`, `updateDrop`, `deleteDrop`, `getDrop`, `getDropByToken`, `listDropsByOwner`, `addPledge`, `updatePledge`, `getPledgeByToken`, `mergePledges`, `listPledgesByDrop`, `addInvites`, `markInviteResent`, `listInvitesByDrop`, `subscribe` — **all of it** backed purely by `localStorage`.

**Disposition: Move to DynamoDB via Amplify Data.** The models already exist in `amplify/data/resource.ts` (`Drop`, `Pledge`, `Invite`) with `publicApiKey` + `authenticated().to(['read'])` authorization and a `publicToken` secondary index.

**Callers that break the "no localStorage" guarantee today:**
- `src/pages/NewDrop.tsx:6` — `store.createDrop` (persistDrop is called alongside but `store.createDrop` runs first and is the source of truth).
- `src/pages/ReviewDrop.tsx:6` — `store.getDrop`, `store.updateDrop`, `store.addInvites`.
- `src/pages/Dashboard.tsx:5` — `store.listDropsByOwner(session.email)` (owner scoping is done in localStorage, not by Cognito identity).
- `src/pages/DropDetail.tsx:7` — `store.getDrop`, `store.listPledgesByDrop`, `store.listInvitesByDrop`, `store.markInviteResent`, `store.mergePledges` (with `fetchPledgesByDropId` merged *into* the local store rather than replacing it).
- `src/pages/PublicDrop.tsx:9` — `store.getDropByToken`, `store.addPledge` (tries remote first then falls back to local).
- `src/pages/PledgeStatus.tsx:7` — `store.getPledgeByToken`, `store.updatePledge`.
- `src/components/EmailPreview.tsx:3` — type-only import (`import type`), no runtime dependency. Safe; just move the type when `store.ts` is deleted.
- `src/hooks/useStore.ts:2` — `store.subscribe`. Replace with Amplify Data `observeQuery` subscriptions per page.

**Required replacement:**
- Delete `src/lib/store.ts` wholesale after migration. Each caller should use `client.models.Drop.*` / `client.models.Pledge.*` / `client.models.Invite.*` directly (see `src/lib/remoteDrop.ts` for the existing pattern).
- The `owner` field in `DropRecord` currently holds the organizer's email as a string. Replace with Amplify Data's built-in owner auth (`allow.owner().to(['create','read','update','delete'])`) so the record's owner is the Cognito `sub`, and drop the `organizerEmail` dependency for authorization (keep it as a content field for emails).
- The `id`, `publicToken`, `pledgeToken` values currently come from `generateToken(...)` client-side (`store.ts:79, :80, :123, :124, :175`). IDs can stay generated server-side by Amplify; `publicToken` and `pledgeToken` must stay client/server-generated random strings because they are the unguessable share links — keep the generator, just persist them in DynamoDB rather than localStorage.
- For live updates on the Dashboard and DropDetail pages, switch from `store.subscribe` to `client.models.Drop.observeQuery(...)` / `client.models.Pledge.observeQuery(...)`.

---

### 3. `src/lib/remoteDrop.ts` — comments/behavior treat localStorage as fallback ⚠️ MEDIUM

| Line | Code | What it implies |
|---|---|---|
| `src/lib/remoteDrop.ts:103` | `// Backend not deployed — localStorage still has the pledge.` | Swallows DynamoDB failures because the local store is the fallback |
| `src/lib/remoteDrop.ts:140` | `// Backend not deployed yet — fall back silently to localStorage.` | Same, for Drop creation |

**Disposition: Remove the silent-swallow catch blocks once `store.ts` is deleted.** With DynamoDB as the source of truth, a failed `create` / `list` must surface as a user-visible error — silently pretending it worked loses the user's data. Replace the bare `catch {}` with proper error propagation to the caller and a toast/inline error in the UI.

---

## Non-findings (reviewed and clean)

- `sessionStorage` — no occurrences in `src/` or `amplify/`.
- `IndexedDB` — no occurrences in `src/` or `amplify/`.
- In-memory module-level caches holding persistent data — none. `src/lib/client.ts`, `src/lib/amplify.ts`, `src/lib/email.ts`, `src/lib/utils.ts` are pure configuration/helpers. The only module-level state is the Amplify `generateClient()` handle, which is the expected pattern.
- Amplify Auth config — `amplify/auth/resource.ts` defines `defineAuth` correctly; the issue is purely that the frontend never calls it.
- Amplify Data schema — `amplify/data/resource.ts` already models `Drop`, `Pledge`, `Invite`. Ready to be the source of truth; just needs the frontend rewired and the authorization tightened from `publicApiKey` + `authenticated().to(['read'])` to `allow.owner()` for organizer-only writes (public-token reads can stay on API key for the unauthenticated contributor pages).
- Lambda functions under `amplify/functions/` — no browser-storage API available there by definition; nothing to audit.

---

## Recommended migration order

1. **Auth first.** Wire `signUp` / `signIn` / `signOut` / Google via `aws-amplify/auth` in `Login.tsx` and `Nav.tsx`. Rewrite `useSession` on top of `getCurrentUser` + `Hub`. Delete `src/lib/session.ts`. This alone unblocks owner-scoped Data auth.
2. **Data second.** Tighten `Drop` / `Pledge` / `Invite` authorization to `allow.owner()` (plus keep public-token read paths for contributors). Rewrite each page listed in §2 to call `client.models.*` directly. Delete `src/lib/store.ts` and `src/hooks/useStore.ts`.
3. **Cleanup.** Remove the fallback comments and bare catches in `src/lib/remoteDrop.ts`, or fold its contents into the pages that use them since the "remote vs local" split no longer exists.

---

**Bottom line:** nothing to fix in this audit PR — the findings are architectural. Every durable piece of app state needs to move: session → Amplify Auth, domain data → Amplify Data (already defined, just not used as the source of truth).
