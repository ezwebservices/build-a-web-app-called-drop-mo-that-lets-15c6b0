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
4427b9b768d1fa36c3917f293daa875c478a5a20-building/index.js  961.6kb
                                    ⚡ Done in 73ms
2026-04-17T21:02:07.507Z [WARNING]: [WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
                                    use `logGroup` instead
                                    This API will be removed in the next major release.
2026-04-17T21:02:07.507Z [WARNING]: [WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
                                    use `logGroup` instead
                                    This API will be removed in the next major release.
2026-04-17T21:02:07.508Z [WARNING]: Bundling asset amplify-d1u2km81dncoin-main-branch-30a4492368/function/send-invites-lambda/Code/Stage...
2026-04-17T21:02:07.982Z [WARNING]: Be careful when using @auth directives on a field in a root type. @auth directives on field definitions use the source object to perform authorization logic and the source will be an empty object for fields on root types. Static group authorization should perform as expected.
2026-04-17T21:02:08.237Z [WARNING]: [WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
                                    use `logGroup` instead
                                    This API will be removed in the next major release.
2026-04-17T21:02:08.237Z [WARNING]: [WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
                                    use `logGroup` instead
                                    This API will be removed in the next major release.
2026-04-17T21:02:08.238Z [WARNING]: Bundling asset amplify-d1u2km81dncoin-main-branch-30a4492368/function/schedule-drop-lambda/Code/Stage...
2026-04-17T21:02:08.611Z [WARNING]: [WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
                                    use `logGroup` instead
                                    This API will be removed in the next major release.
2026-04-17T21:02:08.611Z [WARNING]: [WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
                                    use `logGroup` instead
                                    This API will be removed in the next major release.
2026-04-17T21:02:08.618Z [WARNING]: Bundling asset amplify-d1u2km81dncoin-main-branch-30a4492368/function/progress-image-lambda/Code/Stage...
2026-04-17T21:02:08.914Z [WARNING]: [WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
                                    use `logGroup` instead
                                    This API will be removed in the next major release.
2026-04-17T21:02:08.920Z [WARNING]: [WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
                                    use `logGroup` instead
                                    This API will be removed in the next major release.
                                    Bundling asset amplify-d1u2km81dncoin-main-branch-30a4492368/function/drop-day-lambda/Code/Stage...
2026-04-17T21:02:09.318Z [WARNING]: [WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
                                    use `logGroup` instead
                                    This API will be removed in the next major release.
2026-04-17T21:02:09.318Z [WARNING]: [WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
                                    use `logGroup` instead
                                    This API will be removed in the next major release.
2026-04-17T21:02:09.319Z [WARNING]: Bundling asset amplify-d1u2km81dncoin-main-branch-30a4492368/function/public-share-lambda/Code/Stage...
2026-04-17T21:02:10.308Z [INFO]: 9:02:10 PM ✔ Backend synthesized in 5.09 seconds
2026-04-17T21:02:10.308Z [INFO]: 
2026-04-17T21:02:10.309Z [INFO]: 9:02:10 PM Running type checks...
2026-04-17T21:02:10.309Z [INFO]: 
2026-04-17T21:02:20.262Z [INFO]: 9:02:20 PM ✔ Type checks completed in 9.95 seconds
2026-04-17T21:02:20.279Z [INFO]: 9:02:20 PM Building and publishing assets...
2026-04-17T21:02:21.995Z [INFO]: 9:02:21 PM ✔ Built and published assets
2026-04-17T21:02:22.717Z [INFO]: 
2026-04-17T21:02:22.718Z [INFO]: Notices:
                                 3127	Amplify Function is dropping support of Node 16 Lambda Functions
                                 If you have Node 16 Lambda functions defined with Amplify Function, we highly
                                 recommend updating your function's runtime to newer Node LTS versions (Node 20+).
                                 More information at: https://github.com/aws-amplify/amplify-backend/issues/3127
                                 If you don't want to see a notice anymore, use npx ampx notices acknowledge <notice-id>
2026-04-17T21:02:22.761Z [INFO]: 
2026-04-17T21:02:22.762Z [INFO]: [CloudformationStackCircularDependencyError] The CloudFormation deployment failed due to circular dependency found between nested stacks [data7552DF31, function1351588B]
                                 Resolution: If you are using functions then you can assign them to existing nested stacks that are dependent on functions or functions depend on them, for example:
                                 1. If your function is defined as auth triggers, you should assign this function to auth stack.
                                 2. If your function is used as data resolver or calls data API, you should assign this function to data stack.
                                 To assign a function to a different stack, use the property 'resourceGroupName' in the defineFunction call and choose auth, data or any custom stack.
                                 If your circular dependency issue is not resolved with this workaround, please create an issue here https://github.com/aws-amplify/amplify-backend/issues/new/choose
2026-04-17T21:02:22.762Z [WARNING]: ampx pipeline-deploy
                                    Command to deploy backends in a custom CI/CD pipeline. This command is not inten
                                    ded to be used locally.
                                    Options:
                                    --debug            Print debug logs to the console
                                    [boolean] [default: false]
                                    --branch           Name of the git branch being deployed
                                    [string] [required]
                                    --app-id           The app id of the target Amplify app[string] [required]
                                    --outputs-out-dir  A path to directory where amplify_outputs is written. I
                                    f not provided defaults to current process working dire
                                    ctory.                                         [string]
                                    --outputs-version  Version of the configuration. Version 0 represents clas
                                    sic amplify-cli config file amplify-configuration and 1
                                    represents newer config file amplify_outputs
                                    [string] [choices: "0", "1", "1.1", "1.2", "1.3", "1.4"] [default: "1.4"]
                                    --outputs-format   amplify_outputs file format
                                    [string] [choices: "mjs", "json", "json-mobile", "ts", "dart"]
                                    -h, --help             Show help                                     [boolean]
2026-04-17T21:02:22.838Z [ERROR]: !!! Build failed
2026-04-17T21:02:22.839Z [ERROR]: !!! Error: Command failed with exit code 1
2026-04-17T21:02:22.839Z [INFO]: # Starting environment caching...
2026-04-17T21:02:22.839Z [INFO]: # Uploading environment cache artifact...
2026-04-17T21:02:22.945Z [INFO]: # Uploaded environment cache artifact
2026-04-17T21:02:22.945Z [INFO]: # Environment caching completed


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

1. **Engineer**: Fix the CloudFormation circular dependency between data and function nested stacks. Audit amplify/backend.ts, amplify/data/resource.ts, and each amplify/functions/*/resource.ts. For EVERY Lambda that (a) is referenced in data/resource.ts (as a resolver, handler, or via a.handler.function()), OR (b) calls the Amplify Data API / GraphQL at runtime, set `resourceGroupName: 'data'` in its defineFunction call. For Lambdas that don't touch data, leave them in the default function group. Also check that data/resource.ts doesn't reference functions that are NOT in the data group (which would recreate the cycle). Inspect the previous commit 35c3379 to see what was already assigned and identify what was missed (e.g. send-invites-lambda, schedule-drop-lambda, progress-image-lambda, drop-day-lambda, public-share-lambda — the ones bundled in the logs). Then run `npm run build` locally until it exits 0, and commit + push with message 'Fix: resolve remaining data/function circular stack dependency'. DO NOT disable pipeline-deploy. DO NOT commit amplify_outputs.json.

---

