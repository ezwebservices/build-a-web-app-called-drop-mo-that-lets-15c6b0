# Iteration Whiteboard

**Change request:** error creating account: Attributes did not conform to the schema: The attribute preferredUsername is not defined in schema.

**Subtasks planned:** 1

1. **Engineer**: Fix the 'Attributes did not conform to the schema: The attribute preferredUsername is not defined in schema' signup error. Investigate amplify/auth/resource.ts and the Authenticator/signup form configuration. Either (a) add preferredUsername to userAttributes in the auth resource so it's part of the Cognito schema, or (b) remove preferredUsername from the signUpAttributes / formFields passed to <Authenticator> so it's not sent. Choose whichever matches the intended UX — if the app doesn't actually need a preferred username (Drop-mo uses email-based auth per CLAUDE.md), remove it from the form. Run npm run build until it exits 0 and verify the signup flow no longer throws the schema error.

---

