# Atlas fan board rollout

The public board is linked above Official Channels. Google sign-in reuses the existing Atlas callback. Messages, user-entered nicknames and optional avatars are visible only after a board moderator approves the post. Moderators can hide a published post. Private site feedback is a separate feature.

The browser crops and re-encodes the chosen avatar as a small WebP, removing original file metadata. The database accepts a bounded WebP data URL. No Google profile image, Google display name, email, or account identifier appears in a public post. The database stores an internal owner reference. Public and authenticated readers have no SELECT grant on post owner IDs. Each account can read only its own profile. Posts retain their reviewed nickname and avatar, so changing a profile affects future posts.

## Production approval and rollout

1. Review `sql/optional-fan-board.sql` and explicitly approve applying it to the shared Supabase project. The migration adds two Atlas tables, grants, row policies, a trigger and a security-invoker function. It requires the existing Atlas Google-admin check. Existing tables, Google OAuth settings and the legacy site are left intact.
2. Apply the SQL in a single transaction. Verify that a visitor sees only published posts, a Google user can submit but cannot publish or list other users’ profiles, and an Atlas administrator can approve and hide a test post.
3. Merge the frontend PR after verification. Check Google sign-in return, upload a test avatar, approve its post and verify public rendering. GitHub Pages deployment does not apply SQL.

## Rollback

Revert the frontend PR and revoke anonymous and authenticated grants on the new tables, along with execution of `wsd_atlas_submit_fan_post`. This disables public and signed-in use while preserving the submitted material for moderator review. Dropping the tables is separate and requires approval for deletion.
