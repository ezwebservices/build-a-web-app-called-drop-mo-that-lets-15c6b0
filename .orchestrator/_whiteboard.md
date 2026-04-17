# Iteration Whiteboard

**Change request:** The public page still is not working: This main.d1u2km81dncoin.amplifyapp.com page can’t be found
No webpage was found for the web address: https://main.d1u2km81dncoin.amplifyapp.com/d/dEMDjjhHh2dGSRK2qdGUm1RK/ console log: (index):1 Unsafe attempt to load URL https://main.d1u2km81dncoin.amplifyapp.com/d/BXF3k4aFhUA3MT5EVjNigm2e/ from frame with URL chrome-error://chromewebdata/. Domains, protocols and ports must match. Also on the invite  i did not not receive the email?

**Subtasks planned:** 2

1. **Engineer**: Fix two production bugs on the deployed Amplify site (main.d1u2km81dncoin.amplifyapp.com):

1) PUBLIC DROP PAGE 404 — /d/:token returns 'webpage can't be found'. Root cause is almost certainly that Amplify Hosting isn't rewriting unknown paths to /index.html for the Vite SPA. Fix by adding a SPA rewrite rule. Two acceptable approaches:
   a) Add a `customHttp.yml` or update `amplify.yml` with a redirect rule: source `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>` target `/index.html` status `200` (rewrite).
   b) Or write `public/_redirects` with `/* /index.html 200` (Amplify Hosting supports Netlify-style _redirects when placed in the build output).
   Verify the React Router (or whichever router is used) has a route registered for `/d/:token` that renders the public contributor page, and that the page does NOT require auth (contributors have no account — they access via unguessable signed link, per CLAUDE.md).
   Also check the route path casing matches what the invite email links to.

2) INVITE EMAILS NOT ARRIVING — the Lambda that sends invites via Amazon SES isn't delivering. Investigate and fix:
   - Confirm the send-invite Lambda (amplify/functions/<send-invite-or-similar>/resource.ts) uses `secret('...')` for any secrets and has IAM permissions for `ses:SendEmail` / `ses:SendRawEmail` on the FROM identity.
   - Confirm the FROM address (and domain if applicable) is verified in SES in the deployed region. If the account is still in SES sandbox, TO addresses must also be verified — surface this clearly and either (a) verify brandondezzo@gmail.com as a test recipient, or (b) document the SES production-access request. Default FROM should be a verified identity; if none exists, wire it to an env/secret and log a clear error instead of silently failing.
   - Check CloudWatch logs for the invite Lambda after a send attempt; make sure errors are caught and surfaced back to the frontend (the organizer should see 'Couldn't send invites: <reason>' rather than silent success).
   - Ensure the invite email body contains the correct absolute URL to /d/:token using the deployed Amplify domain (not localhost), read from an env var like `APP_BASE_URL` (set via Amplify Hosting envVars, not hardcoded).

After changes: run `npm install` then `npm run build` until it exits 0. Commit with a clear message. Do NOT add TODOs or placeholders — fully implement both fixes per CLAUDE.md.
2. **QA**: After Engineer's fix is deployed, verify end-to-end on the live Amplify URL:
1) Visit https://main.d1u2km81dncoin.amplifyapp.com/d/<any-token> directly (fresh tab, no history) — confirm the SPA loads the public drop page (or a proper 'drop not found' state for an invalid token) instead of a 404 'webpage can't be found'. Also hard-refresh the page and confirm it still renders (this is the real SPA-rewrite test).
2) As an organizer, create a drop and send an invite to brandondezzo@gmail.com. Confirm the email arrives within ~2 minutes, the invite link points to the deployed Amplify domain (not localhost), and clicking it opens the public drop page successfully. If SES is still in sandbox mode, document that clearly and verify with a sandbox-verified recipient.
3) Check browser console on the public page — no unsafe-URL/CSP errors, no 404s on assets.
Report pass/fail for each with screenshots or the exact error if anything fails.

---

