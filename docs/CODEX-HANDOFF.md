# EKIDEN ATLAS — Codex handoff (2026-11-18)

## Current verified state
- Source: https://github.com/ekiden-atlas/ekiden-atlas.github.io (`main`).
- Public website: https://ekiden-atlas.github.io/ . GitHub Actions deploy run `44271096455` completed successfully on November 18, 2026. The workflow reported the published URL, but this does **not** prove all user interactions/auth paths have been browser-tested.
- Core code (26 initial files): responsive HTML/CSS, Chinese/Japanese i18n, roster filtering, stories, recent ekiden races, World Athletics ranking explanations, Supabase read-only data access, an admin UI scaffold, tests and CI/deployment workflow.
- Shared Supabase project: `oflrjljywtqpgrcetwob`. Legacy data includes 26 `wsd_athlete_basic_profiles` entries, 12 `wsd_athlete_world_rankings` rows and `wsd_open_archive_edits` overlays (counts were observed at first review, not guaranteed current).
- Initial static roster has 48 `2026` snapshot entries; these are not independently verified in full and must not be presented as a current official roster.
- The optional database migration `sql/optional-managed-content.sql` has **not** been applied. The original site does not automatically read `wsd_public_content` and does not support newly proposed two-site sync.
- The original personal account and email appear in public Git commit/Actions metadata. Do not repeat these in website copy; remediation of historical commits requires separate, explicit approval.

## Known incomplete tasks — execute in order where safe

### 1. Audit and quality (safe frontend/CI PR)
- Fix stale documentation: the README still says the organization repo and Pages site have not been created, which is now false; distinguish deployed site from unconfigured administrative/data integrations.
- Test production website in desktop/mobile browsers for console errors, links, responsive breakpoints, language switching including empty/error states, full keyboard access and screen reader labels.
- Review all source/DOM/asset/network requests for personal repo identifiers, unauthorized media, accidental exposure of personal details and any secret-like strings. Never add unlicensed content.
- Recheck test coverage and automated checks without dropping existing tests; `npm test` and `node tests/data-integrity.mjs`.
- Verify athlete names and school/university/WA rankings against primary sources, recording data dates, avoiding inferred ranks.

### 2. Historical data pipeline (safe new-repo PR; needs owner setting)
- The deployment run logs said `SOURCE_RECORDS_URL is not configured; retaining the curated local snapshot`.
- Make historical archive and fallback behavior transparent in the UI. Verify `scripts/build-archive.mjs` validates source input and outputs only factual allowlisted fields, and does not expose the original account's identity.
- Ask owner to set `SOURCE_RECORDS_URL` as a GitHub Actions **repository secret** and rerun deployment, if they want the full historical collection; do not commit secret values or raw personal repo URLs.
- Verify archive categories/record keys and overlay merges; historical times and rankings may use different courses/scopes.

### 3. Auth and admin (requires review; do not run production migration)
- Check Google OAuth callback allowlist for `https://ekiden-atlas.github.io/` with owner. Do not replace callback URLs used by original site.
- Audit `sql/optional-managed-content.sql` for RLS, secured RPC authorization against existing admins, creation of new admin rights, strict non-admin write denials, audit old/new payloads, soft delete/restore, source/copyright fields, and cross-table integrity.
- RLS on existing `wsd_athlete_basic_profiles` and `wsd_open_archive_edits` permits writes by some ordinary signed-in users; this new site must not use those permissive write paths for administrator management.
- Present migration preview, tests and rollback plan for approval **before** executing any DB write. Do not expose service-role keys in public code or workflows.
- Test Google login/admin/non-admin in both languages after any approved setup.

### 4. Cross-site sync (requires separate approval before editing legacy site)
- Read `docs/ORIGINAL-SITE-SYNC.md`. The legacy site contains static PB/records; Supabase writes will not automatically reach it.
- Propose a backwards-compatible, **read-only** adapter for the legacy site on a separate branch/PR only with owner approval. Test existing original site's behavior thoroughly and maintain a rollback path.
- No direct replacement of the original site's index/data or weakening its existing security policies.

### 5. Privacy follow-up requiring owner choice
- Current GitHub commit author metadata may reveal the personal account and email. GitHub Pages URL alone does not anonymize repository history.
- Advise owner to use GitHub's private/noreply commit email and review Organization member visibility. Do **not** rewrite Git history or force push without explicit approval.

## Definition of done
A PR should provide a succinct changelog, affected files, tests and browser checks, citations for new external facts, privacy/security impact, any manual dashboard configuration, and explicit statement on whether production Supabase or the original site were touched.

## Suggested first Codex task
> Read AGENTS.md and docs/CODEX-HANDOFF.md, then inspect the EKIDEN ATLAS repository. Start with a **safe frontend/docs-only PR**: reconcile stale README/deployment statements with verified GitHub Pages publication, audit and fix i18n omissions and browser responsiveness, and add meaningful smoke tests. Do not touch the original repository or production Supabase schema/data/auth/RLS. Flag any security and privacy concerns with evidence. Run tests and provide a PR, not a direct force push.
