# Iteration Whiteboard

**Change request:** An AWS Amplify deployment FAILED for this project. You must analyze the build error logs below, identify the ROOT CAUSE, fix the underlying problem, run `npm run build` locally to verify it compiles cleanly, then commit and push.

PROJECT IDEA:
Build a web app called Drop-mo that lets someone coordinate a surprise Venmo "drop" for a friend or family member hit by an emergency — basement flood, medical bill, job loss, whatever. The organizer creates a private campaign, shares it by email with friends and family, contributors pledge an amount, and on a chosen drop day everyone sends their pledged amount to the recipient's Venmo at roughly the same time. The recipient wakes up to a flood of support without ever knowing it was coordinated.
Origin story — preserve this feeling in every UX decision
A friend's basement flooded. I want to rally friends and family to help, but I don't want the recipient to know anyone's organizing behind the scenes. I want it to feel like spontaneous, overwhelming generosity from their whole network arriving at once. The surprise IS the product.
Brand voice

Name: Drop
Core verb: "Start a drop" / "Join the drop" / "Drop day"
Tagline candidates: "Rally the group. Surprise the one." · "Pull off the surprise." · "They feel the love. They never see it coming."
Vibe: Hype but considerate. Conspiratorial-in-a-good-way. Think: group chat energy, not charity-platform energy.


Tech Stack (non-negotiable)

AWS Amplify Gen 2 (TypeScript-first, code-defined backend)
Frontend: React + TypeScript + Vite
Backend: Amplify Data (AppSync + DynamoDB), Amplify Auth (Cognito), Amplify Functions (Lambda)
Email: Amazon SES via Lambda for invitations, reminders, drop-day triggers
Dynamic image rendering: Lambda + @vercel/og or satori + resvg-js for on-demand PNG generation (live email content)
Scheduled jobs: EventBridge Scheduler → Lambda for day-before and drop-day sends
Animation: Framer Motion (required — see Design)
Styling: Tailwind CSS + shadcn/ui
Hosting: Amplify Hosting


User Roles

Organizer — Cognito account (email/password + Google). Creates and manages drops.
Contributor — no account. Accesses drop via an unguessable signed link. Pledges and self-reports.
Recipient — not a user. Just a person with a Venmo handle. Never logs in, ideally never sees the app.


Core Flows
Organizer

Sign up / log in
Start a drop:

Recipient first name (no last name)
Recipient Venmo handle — single input, just @username (auto-strip any leading @ the user types)
Story (markdown textarea, feels like writing a letter)
Goal amount (optional)
Drop date + time (timezone-aware)
Personal note for the invite email


Review the auto-generated branded invite email (see Email System) — edit subject line, the personal note, or preview the live progress image before sending
Invite contributors by pasting emails (comma or newline separated) → Lambda batches SES sends
Watch dashboard: live-feed of pledges, progress bar, invitee status, post-drop-day "sent" status
Re-send invite / nudge pending invitees anytime before drop day
Edit / postpone / cancel any time before drop day

Contributor

Receive branded invite email (with live progress image)
Open the drop page — a single scrolling experience
Enter name (or mark anonymous), email, pledge amount, optional note
Receive confirmation email (branded, with live progress image)
Day-before reminder email
Drop-day email at the scheduled time containing:

Pre-filled Venmo deep link (handle + amount + note populated)
"I sent it" button that marks the pledge as completed


Can return to the page later to update status

Recipient

Gets hit with multiple Venmo payments on drop day. That's it.

DEPLOY ERROR LOGS (last 8000 chars from Amplify):
```
2026-04-17T17:56:59.213Z [INFO]: # Build environment configured with Standard build compute type: 8GiB Memory, 4vCPUs, 128GB Disk Space
2026-04-17T17:56:59.458Z [INFO]: # Retrieving Git provider SSH public keys
2026-04-17T17:56:59.859Z [INFO]: # Successfully retrieved Git provider SSH public keys
2026-04-17T17:56:59.859Z [INFO]: # Cloning repository: git@github.com:ezwebservices/build-a-web-app-called-drop-mo-that-lets-15c6b0.git
2026-04-17T17:57:00.880Z [INFO]: Agent pid 461
2026-04-17T17:57:00.881Z [INFO]: Identity added: /root/.ssh/git_rsa (/root/.ssh/git_rsa)
                                 Cloning into 'build-a-web-app-called-drop-mo-that-lets-15c6b0'...
2026-04-17T17:57:00.881Z [INFO]: # Switching to commit: 6b59748a0703fa5c523d99ee706601cc0eed064a
2026-04-17T17:57:00.906Z [INFO]: Agent pid 472
2026-04-17T17:57:00.906Z [INFO]: Identity added: /root/.ssh/git_rsa (/root/.ssh/git_rsa)
                                 Note: switching to '6b59748a0703fa5c523d99ee706601cc0eed064a'.
                                 You are in 'detached HEAD' state. You can look around, make experimental
                                 changes and commit them, and you can discard any commits you make in this
                                 state without impacting any branches by switching back to a branch.
                                 If you want to create a new branch to retain commits you create, you may
                                 do so (now or later) by using -c with the switch command. Example:
                                 git switch -c <new-branch-name>
                                 Or undo this operation with:
                                 git switch -
                                 Turn off this advice by setting config variable advice.detachedHead to false
                                 HEAD is now at 6b59748 Fix deployment errors (attempt 1)
2026-04-17T17:57:00.924Z [INFO]: Successfully cleaned up Git credentials
2026-04-17T17:57:00.924Z [INFO]: # Checking for Git submodules at: /codebuild/output/src2626837363/src/build-a-web-app-called-drop-mo-that-lets-15c6b0/.gitmodules
2026-04-17T17:57:00.932Z [ERROR]: !!! CustomerError: Unable to parse build spec: duplicated mapping key (9:1)
                                  6 | - npm ci --cache .npm --prefer- ...
                                  7 | - npx ampx pipeline-deploy --br ...
                                  8 | frontend:
                                  9 | phases:
                                  ------^
                                  10 | preBuild:
                                  11 | commands:
2026-04-17T17:57:00.933Z [INFO]: # Starting environment caching...
2026-04-17T17:57:00.933Z [INFO]: # Environment caching completed


```

## HARD RULES — DO NOT VIOLATE

1. **NEVER comment out, disable, or remove `npx ampx pipeline-deploy` from amplify.yml.** If pipeline-deploy is failing, the IAM role or CDK bootstrap is the real problem. Disabling it leaves the backend stuck on a stale schema and breaks every GraphQL mutation. DO NOT do this.

2. **NEVER commit `amplify_outputs.json` to git.** That file is GENERATED by `npx ampx pipeline-deploy` at deploy time. If you see it in the repo, run `git rm --cached amplify_outputs.json` and add `amplify_outputs*` to .gitignore.

3. **NEVER add `!/amplify_outputs.json` exception to .gitignore** to keep tracking it. This is the wrong direction.

4. **NEVER create stub/empty amplify_outputs.json files** to make TypeScript happy. The right fix is to ensure pipeline-deploy runs in CI.

5. **In amplify/functions/<name>/resource.ts, ALL runtime values must use `secret('NAME')`, NOT `process.env`.** Using `process.env.X || ''` reads at BUILD time (where the env var is unset) and bakes the empty string into the deployed Lambda. This causes errors like "items[0][price] cannot be empty". The orchestrator writes runtime secrets to SSM at /amplify/shared/{appId}/{NAME} — the runtime resolver only fetches them for keys declared with secret().

## ROOT CAUSE GUIDE

- `BootstrapDetectionError` / `ssm:GetParameter` / `cloudformation:GetTemplateSummary` errors → IAM role on Amplify app is missing or lacks permissions. The orchestrator app should have already attached the role; if not, the user needs to fix it manually in the AWS Console. DO NOT disable pipeline-deploy.
- `Cannot find module amplify_outputs.json` → pipeline-deploy isn't running OR isn't running BEFORE `npm run build`. Check amplify.yml ordering. DO NOT create a stub file.
- `items[X][price] cannot be empty` (Stripe) / `Invalid API Key provided: <value will be resolved during runtime>` → resource.ts uses `process.env.STRIPE_PRICE_ID` instead of `secret('STRIPE_PRICE_ID')`. Change it to use secret(). Same fix for any other Stripe/third-party env var.
- TypeScript errors in src/ → fix the actual TS error in the source file.
- Missing npm package → add it to package.json.
- Lambda function errors → fix the function code in amplify/functions/<name>/handler.ts.

## STEPS

1. Read the error logs carefully — find the FIRST error (later errors are usually cascades).
2. Identify which file/module is the root cause.
3. Fix the root cause in the source. NEVER disable or skip a build step.
4. Run `npm run build` locally — fix until it passes clean.
5. If your fix involves amplify.yml, double-check it still runs `pipeline-deploy`.
6. Run: git add -A && git commit -m "Fix: <brief description>" && git push
7. The push will trigger a new Amplify deploy automatically.

Do not stop until the local build is clean and changes are pushed.

**Subtasks planned:** 1

1. **Installer**: Fix amplify.yml YAML parse error 'duplicated mapping key (9:1)'. Read the current amplify.yml — it has duplicated keys (likely two 'phases:' under one section, or duplicated frontend/backend blocks from the previous fix attempt). Rewrite it to the canonical Amplify Gen 2 structure with exactly one 'backend:' section (preBuild: npm ci; build: npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID) and exactly one 'frontend:' section (preBuild: npm ci; build: npm run build; artifacts baseDirectory: dist, files: **/*; cache paths: node_modules/**/* and .npm/**/*). DO NOT remove or comment out `npx ampx pipeline-deploy` — it is required to generate amplify_outputs.json. Verify amplify_outputs.json is NOT committed (gitignored). Run `npm run build` locally until it exits 0 (note: it may fail locally if amplify_outputs.json is missing — that is expected and will be generated by pipeline-deploy in CI; if so, ensure the frontend code handles missing config gracefully per CLAUDE.md). Then: git add -A && git commit -m 'Fix: repair duplicated mapping key in amplify.yml' && git push.

---

