# Quickstart: Validating Security Hardening & Pre-Deploy Checks

Manual validation guide, one section per user story (see `spec.md`). No test framework exists in this repo (see research.md Decision 10) — every check here is a runnable manual step.

## Prerequisites

- The owner's single Supabase Auth user has been created via the dashboard (email + password).
- `contracts/rls-migration.sql` has been applied against the Supabase project (with `<OWNER_UUID>` filled in).
- `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (already present) plus any Turnstile site key added for this feature.
- `npm run dev` running locally.

## US1 — Personal data is no longer publicly writable

1. In the Supabase SQL Editor, run a query using only the anon key context (e.g. via `supabase-js` with the anon key and no `Authorization` session header, or via `curl` against the REST endpoint with only `apikey: <anon key>`) attempting `select * from registro`. **Expected**: zero rows / permission-denied, not the full table.
2. Log in as the owner in the app and load `/registro`. **Expected**: existing entries (created before this feature) are still visible.
3. Attempt the same anon-only `insert`/`delete` against `registro`. **Expected**: rejected.

## US2 — Owner logs in before seeing any personal data

1. Open a private/incognito browser window, visit `/calendario` directly. **Expected**: redirected to `/login`, no calendar data visible even momentarily.
2. Repeat for `/registro`, `/estadisticas`, `/nutricion`.
3. Log in with the correct email/password. **Expected**: redirected back to the originally requested page (or home), session persists on refresh.
4. Log in with a wrong password 3 times in a row. **Expected**: on the Nth attempt (per the configured threshold), the app responds with a throttling message instead of attempting Supabase auth again.
5. Close and reopen the browser (same profile, cookies retained) within the session lifetime. **Expected**: still logged in, no re-prompt.

## US3 — Safe to deploy: validated input & confirmations

1. Using browser dev tools or a direct `fetch` to the server action endpoint, submit `saveLog` with an out-of-range `valor` (e.g. a negative weight) or a malformed `fecha`. **Expected**: rejected with an error, no row written.
2. In the UI, trigger a delete on an existing `registro` entry. **Expected**: a confirmation step appears before the row is actually removed; cancelling leaves the row intact.

## US4 — Deploy previews and search engines

1. Build and inspect a page's rendered `<head>` when `process.env.CONTEXT` (or whichever Netlify context variable is used) indicates a deploy-preview build. **Expected**: `<meta name="robots" content="noindex">` (or equivalent) present.
2. Do the same for a production build. **Expected**: no `noindex`, and `<link rel="canonical">` present with the correct absolute URL for that page, and exactly one `<h1>`.
3. Paste the production URL into a chat app that renders link previews (or use a link-preview debugger). **Expected**: title, description, and image render correctly.

## US5 — Clean, accessible pages with no regressions

1. Open each of the 5 pages (home, Registro, Calendario, Estadísticas, Nutrición) with the browser console open. **Expected**: zero errors/warnings on each.
2. Inspect every `<img>` on each page. **Expected**: every image has a meaningful `alt` (or `alt=""` with a code comment/context indicating it's decorative).
3. Exercise the mobile drawer, sidebar hover states, and any loading/skeleton animations from 002-frontend-redesign. **Expected**: all behave exactly as before this feature's changes.

## US6 — Infrastructure hardened

1. Request the deployed app over `http://` (e.g. `curl -I http://<domain>`). **Expected**: `301`/`308` redirect to `https://`.
2. Script a handful of automated POSTs to the login form without a valid Turnstile token. **Expected**: rejected before Supabase Auth is even called.
3. Grep the codebase for `.rpc(` and any string-concatenated SQL. **Expected**: no matches, or any match uses parameterized calls only.

## Pre-deploy sign-off checklist

- [x] US1–US6 all pass manually as above.
- [x] `Deploy_V1/plan_vida_2026 copy.html` and `plan_vida_2026.html` are no longer tracked by git (`git ls-files | grep -c plan_vida` returns `0`).
- [x] No `NEXT_PUBLIC_`-prefixed env var contains a `service_role` or other elevated key (`grep -r "NEXT_PUBLIC_" .env.local` reviewed by hand — only URL, anon key, and the public Turnstile sitekey).
- [x] `next build` output reviewed for unusually large route bundles (~912K total chunks, largest single chunk 224K — nothing anomalous).
