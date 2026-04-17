# Deploy Status

Local `npm run build` exits 0 cleanly. App code is healthy.

## Blocker: IAM permission on Amplify CodeBuild role

Amplify deploy fails at `npx ampx pipeline-deploy` with:

```
[BootstrapDetectionError] ... AccessDeniedException: User:
arn:aws:sts::073653171576:assumed-role/AemiliaControlPlaneLambda-CodeBuildRole-1PJH7JZRIQRPI/...
is not authorized to perform: ssm:GetParameter on resource:
arn:aws:ssm:us-east-1:073653171576:parameter/cdk-bootstrap/hnb659fds/version
```

This is NOT fixable in the repo. The Amplify-managed CodeBuild service role is
missing read access to the CDK bootstrap SSM parameters.

## Required manual fix (AWS Console)

Attach an inline policy to role `AemiliaControlPlaneLambda-CodeBuildRole-1PJH7JZRIQRPI`
(account 073653171576) granting:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["ssm:GetParameter", "ssm:GetParameters"],
    "Resource": "arn:aws:ssm:*:*:parameter/cdk-bootstrap/*"
  }]
}
```

After attaching, re-run the Amplify build. Do NOT disable `pipeline-deploy`,
do NOT stub `amplify_outputs.json`, do NOT skip backend synth in `amplify.yml`.

## SPA rewrites for deep links (e.g. `/d/:token`)

`public/_redirects` ships `/* /index.html 200` so Vite's build output includes it.
Amplify Hosting also needs the equivalent rule registered in the console for
existing apps:

1. Amplify Console → the app → **Rewrites and redirects**
2. Add rule:
   - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>`
   - Target: `/index.html`
   - Type: `200 (Rewrite)`

Without this, `https://.../d/<token>` returns "webpage can't be found" because
Amplify looks for a static file at that path.

## SES invite email delivery

The `send-invites` Lambda requires two Amplify secrets in the deployed branch:

- `SES_FROM_ADDRESS` — a verified SES identity in `us-east-1`
  (e.g. `drop@yourdomain.com` or a verified single address).
- `APP_BASE_URL` — the deployed site URL without trailing slash
  (e.g. `https://main.d1u2km81dncoin.amplifyapp.com`).

Set via:
```
npx ampx sandbox secret set SES_FROM_ADDRESS   # dev
# or Amplify Console → Hosting → Secrets (per branch) for prod
```

If either is missing, the handler now returns a clear error instead of
silently succeeding. Also: while the AWS account is in the SES sandbox, the
**recipient** address must also be verified in SES — verify
`brandondezzo@gmail.com` for testing, or request SES production access.
