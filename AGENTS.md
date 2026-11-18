# Codex project instructions — EKIDEN ATLAS

This repository is the **independent, public, unofficial** Chinese/Japanese university-ekiden information site at https://ekiden-atlas.github.io/. Preserve its separate identity and do not overwrite the original Waseda Running Lab.

## Non-negotiable boundaries
- **Modify only this repository** unless the repository owner expressly authorizes changes elsewhere. Never automatically push to or rewrite the legacy Waseda Running Lab repository.
- **Do not modify the production Supabase schema, existing RLS policies, authentication settings, data, or administrator records** without explicit owner approval after reviewing a migration/impact analysis and rollback strategy. The shared Supabase project ID is `oflrjljywtqpgrcetwob`.
- Keep the public site read-only. Authenticate admins via **server/database-enforced authorization**, not UI hiding or generic Google sign-in. Existing `wsd_community_admins` may be reused for identity checking; do not automatically change its membership. The optional new-admin system is not deployed.
- Never put `service_role`, `sb_secret_*`, database passwords, service credentials, or private repository URLs into client code, build logs, documentation, or repository history. A Supabase **publishable** key is intentionally public.
- Protect privacy: do not add the original personal GitHub username, raw repository URL, personal email, or owner details to published web pages/source/asset URLs. **Git commit metadata is also publicly visible**; recommend a GitHub noreply identity before committing and never rewrite history/force-push without approval.
- Do not display unlicensed athlete photos, official logos, copied news/article bodies, full official diaries, or third-party charts. Prefer factual times, dates, placements, original copy, CSS data displays and clear source links. Preserve Japanese spellings.
- Never invent rankings or blur the distinction between PB, university seasonal lists, Japanese student all-time lists, school records, section awards, and World Athletics point rankings. Mark each ranking's source, date, and scope; omit anything unverified.

## Architecture
- Static GitHub Pages, vanilla HTML/CSS/JS, no unnecessary runtime dependencies.
- `js/i18n.js` is the centralized Simplified Chinese/Japanese dictionary; all public/admin UI, loading/empty/error states and accessibility labels must use it. Persist selected language.
- `data/roster.js` is a 2026 snapshot, not a guaranteed live roster. `data/recent-ekiden.js`, `data/verified.js` hold curated facts.
- `scripts/build-archive.mjs` optionally imports structured historical facts server-side using GitHub Actions `SOURCE_RECORDS_URL` secret. If absent, rely on curated local subset; **do not hard-code the original source URL into browser code**.
- `js/data.js` merges curated static assets with existing **public read-only** Supabase data/overrides.
- `js/admin.js` contains planned admin UX. `sql/optional-managed-content.sql` is **unapplied and must not be treated as active**. `docs/ORIGINAL-SITE-SYNC.md` is a design proposal, not an implemented integration.
- Active deploy workflow: `.github/workflows/deploy.yml`; production URL `https://ekiden-atlas.github.io/`.

## Working procedure
1. Read `README.md`, `docs/CODEX-HANDOFF.md`, `docs/COPYRIGHT-AND-SOURCES.md`, `docs/ORIGINAL-SITE-SYNC.md`, and the relevant code before editing.
2. Start with `npm test` (runs `node tests/check.mjs`); also run `node tests/data-integrity.mjs` where relevant and check all i18n keys, URL paths, and mobile layout.
3. Work in small scoped branches/PRs. For production-sensitive auth/database work, submit a reviewed plan/PR without executing migrations.
4. Report what is implemented vs. proposed, list any manual GitHub/Supabase settings required, and verify real deploy outcomes rather than assuming a successful page.
5. Keep the existing deployed site functioning while iterating. Avoid destructive changes.

## Immediate next work
Follow `docs/CODEX-HANDOFF.md`, prioritizing accurate documentation, privacy audit, end-to-end smoke tests, historical data import configuration, and admin authorization design.