# Anonymous site feedback rollout

The footer sends only the message, without an account token or cookies. The feedback table stores the message, a generated ID and submission time. The admin inbox uses the existing Google-admin check through a row-level security policy. Feedback is rendered as plain text. Existing GitHub issues remain public under GitHub's existing visibility settings.

## Production approval and rollout

1. Review `sql/optional-anonymous-feedback.sql` and approve applying it to the shared Supabase project. It adds one Atlas-specific table, its index, two grants and two row policies. The existing `wsd_atlas_is_google_admin()` function must already exist. The migration does not edit that function, existing tables, administrator memberships or authentication settings.
2. Apply the SQL as a single transaction and verify through the REST API that a logged-out visitor can submit with `Prefer: return=minimal` and cannot read feedback, an ordinary Google user sees zero rows, and an existing Atlas admin can read the test feedback. Use a clearly labeled test message.
3. Merge the frontend PR and confirm the live footer and admin inbox. The SQL is excluded from the Pages artifact and is never applied by Actions.

## Rollback

For immediate containment, revoke the anonymous column-level INSERT grant and the authenticated column-level SELECT grant on `public.wsd_atlas_feedback`. This preserves messages. Revert the frontend PR to restore the previous footer. Retain the database table for review, or remove it separately after backing up feedback and obtaining approval for deletion.
