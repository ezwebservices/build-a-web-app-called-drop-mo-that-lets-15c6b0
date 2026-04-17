# Project

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

## Stack + expectations
- Vite + TypeScript (strict). Tailwind if the idea needs styling.
- Every function fully implemented. No TODOs, no placeholders, no mock data in place of real code.
- `npm install` then keep running `npm run build` until it exits 0.
- Make it feel polished — no console.log noise in production paths, sensible empty/loading/error states, keyboard nav where relevant.

## AWS Amplify Gen 2 deployment
This project ships with aws-samples/amplify-vite-react-template already cloned (React + Vite + TS + Amplify Gen 2 auth/data). Extend it, don't re-scaffold.
- DO NOT import from '../amplify_outputs.json' unconditionally — generated at deploy time. Use try/catch or conditional render.
- If you need auth UI, use <Authenticator> from '@aws-amplify/ui-react' with graceful handling of a missing config.

## Lambda function environment variables (if applicable)
For any amplify/functions/<name>/resource.ts files, EVERY runtime secret MUST use secret('NAME') from '@aws-amplify/backend':
  // RIGHT — resolved from SSM at cold start
  environment: { STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY') }
  // WRONG — bakes empty string into deployed Lambda
  environment: { STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '' }

## Frontend subscription UI (if applicable)
NEVER hardcode price/plan/interval. Read from Vite env vars the orchestrator writes to Amplify Hosting envVars:
  const PLAN_NAME = import.meta.env.VITE_STRIPE_PLAN_NAME || 'Premium';
  const PLAN_AMOUNT_CENTS = parseInt(import.meta.env.VITE_STRIPE_PLAN_AMOUNT || '0', 10);
  const PLAN_CURRENCY = (import.meta.env.VITE_STRIPE_PLAN_CURRENCY || 'usd').toLowerCase();
  const PLAN_INTERVAL = import.meta.env.VITE_STRIPE_PLAN_INTERVAL || 'month';


## Memory from past builds

