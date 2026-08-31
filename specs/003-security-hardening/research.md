# Phase 0 Research: Security Hardening & Pre-Deploy Checks

All Supabase Auth / `@supabase/ssr` / Next.js proxy (formerly middleware) APIs below were verified against current documentation (context7 for Supabase, `node_modules/next/dist/docs/` for Next.js 16.3.3) per Constitution Principle II — none were implemented from memory alone.

## Decision 1: `middleware.ts` does not exist in this Next.js version — use `proxy.ts`

**Decision**: Implement the server-side auth gate as `proxy.ts` (exported function `proxy`), not `middleware.ts`.

**Rationale**: Confirmed in `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md`: "The `middleware.js` file convention has been **deprecated** in Next.js 16 and renamed to `proxy.js`. All functionality remains the same — only the file and export names have changed." This is exactly the kind of breaking-vs-training-data change `AGENTS.md` warns about. The user's request said "middleware.ts"; the current API for the installed Next.js 16.3.3 is `proxy.ts` with an exported `proxy()` function and the same `config.matcher` shape.

**Alternatives considered**: Using `middleware.ts` anyway — rejected, it no longer exists as a working file convention in this version (it's a deprecated doc redirect, not a functioning file).

## Decision 2: Auth session sync — `@supabase/ssr` in `proxy.ts` + server client, cookies only

**Decision**: Replace the current `lib/supabase/server.ts` cookie stub with a real `createServerClient` reading/writing cookies via Next.js's `cookies()` API (server components/actions) and `request.cookies` / `NextResponse` (proxy). `proxy.ts` calls `supabase.auth.getUser()` on every matched request and redirects to `/login` when there's no user. `lib/supabase/client.ts` (browser client) stays as-is — `createBrowserClient` already syncs the same cookies automatically, no localStorage code to remove because none exists.

**Rationale**: This is the documented current pattern (context7, `supabase/supabase` examples `nextjs-supabase-auth.md` / `proxy.ts` under `examples/auth/nextjs-full/lib/supabase/proxy.ts`). Key points pulled directly from docs, not memory:
- Cookie handlers MUST be `getAll`/`setAll` — the old `get`/`set`/`remove` trio is explicitly flagged by Supabase's own docs as a pattern that "WILL BREAK THE APPLICATION."
- Nothing may run between `createServerClient(...)` and `supabase.auth.getUser()` in the proxy — an easy mistake there causes intermittent logouts.
- The `supabaseResponse` object must be returned as-is (or its cookies copied onto a new response) or the browser/server session can desync.
- Next.js's own data-security guide (`node_modules/next/dist/docs/01-app/02-guides/data-security.md`) explicitly warns: a proxy `matcher` change can silently drop coverage for a route, and **Server Functions are not separate routes** in the execution chain — so proxy alone is not sufficient. Each server action must still verify the session itself (Decision 5).

**Alternatives considered**: Keeping session in `localStorage` (status quo default for `createBrowserClient` without SSR) — rejected per the user's explicit P1 ask to move to httpOnly cookies, which also happens to be the only way `proxy.ts` can see the session server-side at all.

## Decision 3: RLS — replace the "allow all" policy with `auth.uid() = user_id` policies

**Decision**: Add a `user_id uuid references auth.users not null default auth.uid()` column to `registro`, backfill existing rows with the owner's `auth.users.id` (created manually in the dashboard first), drop the "Permitir todo con anon key" policy, and add one policy per operation (`select`/`insert`/`update`/`delete`) scoped to `(select auth.uid()) = user_id`, following Supabase's documented pattern for owner-scoped rows.

**Rationale**: This is the standard Supabase-documented shape for single/multi-owner row scoping (context7: `todos` example table+policies, `posts` "Allow update for owners" example). Wrapping `auth.uid()` in `(select ...)` is the pattern shown in the current docs (it lets Postgres cache the result per statement rather than per row).

**Alternatives considered**: A single `for all` policy instead of four — considered and viable (also shown in the docs, `"Users can only access their own todos" ... for all ... using (...)`), but four explicit per-operation policies make the audit trail in the Supabase dashboard clearer for a single-owner app where correctness matters more than policy count. Left as a planning-time implementation choice, not a spec requirement.

**Constitution note**: Per Principle IV, this schema change (new column + backfill + policy replacement) requires explicit prior user approval. That approval was already given in the originating request for this feature (P0/P1 items enumerating exactly this change); no further undocumented schema change is in scope.

**Applied 2026-08-31**: `contracts/rls-migration.sql` ran successfully against the production project after one fix — `alter column user_id set default (select auth.uid())` fails (`cannot use subquery in DEFAULT expression`); a column `DEFAULT` must call `auth.uid()` directly, without the `(select ...)` wrapping that's only valid inside RLS `USING`/`WITH CHECK` clauses. Corrected to `default auth.uid()`. Verified post-migration: 44/44 existing rows backfilled with `user_id`, column `not null`, the open policy replaced by the 4 owner-scoped policies.

## Decision 4: Input validation on server actions — `zod`

**Decision**: Add `zod` as a new dependency and validate every server action's input against a schema before touching Supabase, rejecting invalid input with a typed error before any query runs.

**Rationale**: `app/registro/actions.ts` and `app/calendario/actions.ts` currently pass client-supplied `categoria`, `fecha`, `valor`, `nota` straight into `.insert()`/`.delete()` with zero validation. `zod` is the de-facto standard for this in the Next.js/TypeScript ecosystem, has first-class TypeScript inference (fits Principle I's strict-typing requirement), and is explicitly what the user asked for in P1.

**Alternatives considered**: Hand-rolled `if` validation — rejected, doesn't scale past the first field and produces worse type inference; violates "don't reinvent a validation library" once the task explicitly calls for schema validation.

## Decision 5: Server actions re-check auth themselves, not just proxy

**Decision**: Every server action in `app/*/actions.ts` calls a shared `getAuthedUser()` helper (throws/returns an error result if no session) before running any Supabase query, in addition to the `proxy.ts` gate.

**Rationale**: Directly required by Next.js's own data-security guide: "A matcher change or a refactor that moves a Server Function to a different route can silently remove Proxy coverage. Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone." Defense in depth: this is also what makes FR-003 hold even if a future page or action is added without updating the proxy matcher.

**Alternatives considered**: Relying solely on `proxy.ts` matcher coverage — rejected per the above explicit Next.js guidance, and because RLS (Decision 3) is the real backstop regardless — this helper is about a fast, clear error message, not the last line of defense.

## Decision 6: Rate limiting on `/login` — in-memory, no new backing service

**Decision**: A small in-memory counter (IP + time window) inside the login route/server action, not a hosted rate-limiting service.

**Rationale**: Single-user app, low traffic, no Redis/KV already provisioned. An in-memory limiter is the smallest thing that satisfies FR-008 without adding a paid dependency.

`# ponytail: in-memory rate limit resets on server restart / doesn't share state across multiple server instances — fine for a single-instance Netlify deploy; move to a shared store (Upstash Ratelimit, etc.) only if the deploy target ever becomes multi-instance.`

**Alternatives considered**: Upstash Ratelimit / Vercel KV — rejected as unnecessary infrastructure for a single-user app; Supabase Auth also has its own built-in rate limits as a second layer regardless.

## Decision 7: Bot protection on `/login` — Cloudflare Turnstile, server-verified

**Decision**: Turnstile widget on the login form (client-side script tag, no new npm dependency needed) + server-side verification via a plain `fetch` to Cloudflare's `siteverify` endpoint inside the login server action, before calling Supabase Auth.

**Rationale**: Matches the user's explicit P4 ask ("Cloudflare Turnstile o similar, gratis"); free, no new dependency required since verification is a single `fetch` call.

**Alternatives considered**: A Turnstile React wrapper package — rejected, the widget can be loaded with a plain `<script>` tag and a form-submitted token field, no dependency needed (ladder rung 6: one `fetch` call beats a new package).

**Applied 2026-08-31**: Widget created via the Cloudflare dashboard (not the API/Wrangler-driven Spin wizard — the user created it manually and handed over the sitekey/secret, avoiding the need to grant this session a Cloudflare API token). Two issues hit during live validation, both fixed:
1. Error `110200` ("Domain not authorized") on first load — the widget's domain allowlist didn't include `localhost`; fixed by the user adding it in the widget's Hostname Management settings.
2. The widget didn't auto-render on a fresh page load even after the domain fix — relying on `next/script`'s `onLoad` callback was unreliable relative to `containerRef` being attached. Fixed by polling for `window.turnstile` + the container ref every 150ms in a `useEffect` instead of depending on `onLoad` timing.

Validated end-to-end: real widget challenge → real token → `POST /login` reaches Supabase Auth (530ms round trip, consistent with the siteverify network call executing) → wrong credentials correctly rejected after passing Turnstile; then a real login with correct credentials succeeded, confirming the full gate (rate limit → Turnstile siteverify → Supabase Auth) works without regressing the happy path.

## Decision 8: Legacy tracked files — `git rm --cached`, not `filter-repo`

**Decision**: Run `git rm --cached "Deploy_V1/plan_vida_2026 copy.html" plan_vida_2026.html` and add both to `.gitignore`. No history rewrite.

**Rationale**: Confirmed during the P0 investigation that the only sensitive-looking value in these files is the public anon key (already public by design, not a secret) and the entire repo history is a single commit with no other secrets. History rewriting (`git filter-repo`) is unjustified extra risk/complexity for this case.

**Alternatives considered**: `git filter-repo` — rejected per the above; would only be justified if a real secret (service_role key, password) had been found in history, which it was not.

**Applied 2026-08-31 — production deploy**: The existing `plandevida2026.netlify.app` site (previously a manual Netlify Drop of the legacy static HTML) was relinked to this GitHub repo (`master` branch) via the Netlify dashboard, using Netlify's zero-config Next.js Runtime (auto-detected `npm run build` / `.next`). Found during this step: Netlify's "link repository" wizard has a bug — environment variables entered in that same wizard screen are silently dropped and never attached to the site, so the first deploy failed at runtime with "Your project's URL and Key are required to create a Supabase client!". Fixed by adding all 6 variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`, `NEXT_PUBLIC_SITE_URL`, `TURNSTILE_HOSTNAMES`) directly under Project configuration → Environment variables (not the linking wizard) and triggering a manual redeploy, which built and published successfully. Verified live: HTTPS forced (`http://` → `301`, HSTS present), unauthenticated `/calendario` → `307` to `/login`, `robots.txt` allows indexing under the production `CONTEXT`, Turnstile renders and validates against the production domain, and a real login with the owner's credentials succeeds.

## Decision 9: SEO metadata — Next.js Metadata API (`generateMetadata` / `metadata` export), no new dependency

**Decision**: Use Next.js's built-in `alternates.canonical` and `robots` fields (per-page `metadata` exports) for canonical URLs and conditional `noindex`; `openGraph.images` for the preview image; detect "is this a Netlify deploy preview" via Netlify's own build-time environment variable (`CONTEXT` / `DEPLOY_PRIME_URL`, available at build/runtime on Netlify) to decide the `robots` value per environment.

**Rationale**: Confirmed current shape of `alternates.canonical` and `robots` in `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` (unchanged from prior Next.js versions, no breaking change here). No new dependency needed — this is a config/data problem, not a missing capability.

**Alternatives considered**: A `robots.txt` blanket disallow for preview deploys — rejected, Netlify preview URLs are on the same `*.netlify.app` origin family as other people's sites; a per-page `noindex` meta tag scoped to the actual deploy context is the documented, precise mechanism.

**Found during implementation**: `proxy.ts`'s auth gate (Decision 2) initially redirected `/robots.txt`, `/sitemap.xml`, and `/opengraph-image` to `/login` — these must stay reachable without a session for crawlers and link-preview bots to work at all, which is the entire point of this decision. Fixed by explicitly excluding those paths in `proxy.ts` alongside `/login`.

## Decision 10: Testing approach

**Decision**: Manual validation via `quickstart.md`, consistent with 002-frontend-redesign — no test framework exists in the repo (`package.json` has no `vitest`/`jest`/`playwright`). Given this feature is security-critical, quickstart explicitly includes negative-path checks (unauthenticated access attempts, anon-key-only queries) as first-class steps, not just happy-path clicks.

**Alternatives considered**: Introducing a test framework for this feature only — rejected as disproportionate scope for a single-user app with no existing test infra; flagged as a reasonable future addition, not blocking this feature.
