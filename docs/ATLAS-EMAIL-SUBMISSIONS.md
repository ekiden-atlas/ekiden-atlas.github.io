# Atlas email submission rollout

Email and password registration uses the existing Supabase Auth project. Verified
email accounts can submit results, other submissions and their own attachments.
Existing Google sign-in remains available. Review and content management require
an OAuth session for a Google account with the existing role grant.

## Production checks and changes

- Keep Turnstile enabled. Allow the Atlas hostname on the existing public site
  key, then verify a real challenge in the browser before testing delivery.
  Production rejected a registration request without a challenge token. No test
  email was accepted for delivery.

- Inspect the shared project's Email provider, signup, email confirmation,
  delivery limits and redirect allowlist. Enable Email and email confirmation
  only if required. Verify a deliverable SMTP setup and use the existing Atlas
  callback URL ending in `?atlas-submissions=1` for confirmation and recovery.
  These Auth settings are project-wide and can affect Running Lab.
- Verify that production Google administrators have OAuth in their Supabase AMR
  claims and a linked Google identity. Email may be the primary provider.
  If the account has another linked provider besides email and Google, deny
  privileged access because the OAuth AMR does not identify the provider. Check
  the scope of all callers before replacing the authorization functions.
- Apply the optional SQL only after owner approval. Verify four roles, including
  an administrator account using a password session, before publishing the UI.
  Confirm real signup, confirmation and password recovery with a disposable
  non-administrator mailbox. Check the redirect in a fresh browser.

## Rollback

Roll back the frontend first. Restore the three prior insert policy definitions
and both prior admin function definitions from the production preflight snapshot.
Drop the two new readiness/eligibility functions after restoring those policies.
Restore prior Auth settings if they were changed. Accounts and submissions
created during the rollout are preserved.
