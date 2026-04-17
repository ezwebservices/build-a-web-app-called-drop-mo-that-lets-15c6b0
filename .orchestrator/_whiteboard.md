# Iteration Whiteboard

**Change request:** when you are in a drop i cannot open the public page and get this console error: Unsafe attempt to load URL https://main.d1u2km81dncoin.amplifyapp.com/d/dEMDjjhHh2dGSRK2qdGUm1RK/ from frame with URL chrome-error://chromewebdata/. Domains, protocols and ports must match. perhaps its an auth issue or COrs? also on text share link it is not a branded card just a simple url

**Subtasks planned:** 2

1. **Engineer**: Fix the public drop page at /d/:token so it loads without auth and produces a branded link-preview card.

1) SPA ROUTING FIX (root cause of the chrome-error://chromewebdata failure):
   - Inspect amplify.yml, customHttp.yml, and any Amplify Hosting rewrite/redirect rules currently deployed. The previous commit 54041e6 ('SPA rewrites for /d/:token') is insufficient — the live URL https://main.d1u2km81dncoin.amplifyapp.com/d/<token>/ still returns an error page.
   - Add/verify the Amplify Hosting rewrite: source '</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|xml)$)([^.]+$)/>' target '/index.html' status '200' (or the documented SPA catch-all). Ensure it is committed in a file Amplify picks up (customHttp.yml OR via the Amplify console redirects — document in code where the source of truth is).
   - Confirm the React Router route for /d/:token exists, is PUBLIC (no <Authenticator> wrapper blocking it), and renders even when amplify_outputs.json is missing (per CLAUDE.md guidance).
   - Verify the token-lookup Data query is configured for unauthenticated access (IAM / apiKey auth mode on the Drop model's public-read-by-token resolver) so contributors without Cognito accounts can load the page.

2) BRANDED SHARE-CARD (Open Graph):
   - Add Open Graph + Twitter Card meta tags so pasting the link into iMessage/SMS/Slack/X renders a branded preview instead of a raw URL.
   - Because index.html is static, create an Amplify Function (Lambda behind a Function URL or API Gateway route, wired through the same Amplify Hosting rewrite) at /d/:token that: (a) looks up the drop by token, (b) returns HTML with og:title ('Help surprise <FirstName>'), og:description (short story excerpt or 'Join the drop'), og:image pointing to an OG-image Lambda, og:url, twitter:card=summary_large_image. For crawlers (user-agent sniff on facebookexternalhit, Twitterbot, Slackbot, Discordbot, WhatsApp, LinkedInBot, iMessage) serve the meta-only HTML; for real browsers serve/redirect to the SPA index.html.
   - Implement the OG image Lambda using @vercel/og or satori + resvg-js (already called out in CLAUDE.md) at /og/drop/:token.png — render a 1200x630 branded card: Drop wordmark, 'Help surprise <FirstName>', progress bar (pledged / goal), contributor count, drop date. Cache-Control: public, max-age=300.
   - Use secret('...') for any secrets; read the Amplify Data endpoint from env; do not bake secrets into the Lambda.

3) Run `npm install` then `npm run build` until it exits 0. No TODOs, no placeholders.

Deliverable: public /d/<token>/ URL loads the drop page unauthenticated in a real browser, AND pasting that URL into iMessage/Slack produces a branded preview card with recipient name, progress, and drop date.
2. **QA**: Verify both fixes end-to-end on the deployed Amplify URL (https://main.d1u2km81dncoin.amplifyapp.com):

1) Public page routing: in an incognito window (no Cognito session), navigate to /d/<real-token>/ and confirm the branded drop page renders with recipient name, story, progress bar, and pledge form. Confirm no chrome-error://chromewebdata, no 'Unsafe attempt to load URL' console error, and no auth redirect. Also test /d/<bad-token>/ renders a proper 'drop not found' state (not a crash).

2) Branded share card: curl -A 'facebookexternalhit/1.1' https://.../d/<token>/ and confirm the response HTML contains og:title, og:description, og:image, og:url, twitter:card meta tags with real values (not empty/defaults). Fetch the og:image URL directly and confirm it returns a 1200x630 PNG with the Drop branding, recipient first name, progress, and drop date. Paste the link into iMessage and/or Slack and visually confirm a branded card renders.

3) Regression: confirm organizer dashboard, sign-in, invite-send flows still work; no console errors in production paths.

Report any failures with exact URL, user-agent, HTTP status, and screenshot/console output. Do not sign off unless both (1) and (2) pass.

---

