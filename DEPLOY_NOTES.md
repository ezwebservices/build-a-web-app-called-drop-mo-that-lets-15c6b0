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
