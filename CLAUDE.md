# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

"Bakata" — a multi-user Next.js app to track training (running/gym), nutrition, and
progress toward each user's own events, with public signup and an onboarding flow
that captures a user's profile and events (specs/004-multi-user-onboarding). It
started as "Plan de Vida 2026," a personal app for one user (Brian) tracking three
specific 2026 events (a 10K, the 80km Luján procession, and a 21K) — itself a
migration of a static `plan_vida_2026.html` (not in this repo — excluded via
`.gitignore`). Brian's original plan now lives as the first migrated account in the
multi-user model (`specs/004-multi-user-onboarding/contracts/brian-migration.sql`),
not as a special case in the code.

Read `README.md` for the product framing and `specs/*/spec.md` + `plan.md` for the
history of _why_ things are built the way they are — this repo uses a spec-driven
workflow (`specs/001-...` through `specs/004-...`, each with `spec.md`, `plan.md`,
`research.md`, `data-model.md`, `contracts/`). When touching auth, RLS, or the
training/nutrition data model, check the matching spec folder before assuming the
current shape is incidental — most constraints here were explicit decisions, not
oversights.

## Commands

```bash
npm run dev      # next dev (also regenerates AGENTS.md's Next.js-version banner)
npm run build    # next build
npm run lint     # eslint
npm run format   # prettier --write .
```

There is no test suite in this repo (validation is manual, per `specs/*/quickstart.md`).
There's no `node_modules/` checked in or installed by default — run `npm install`
before anything that needs the Next.js docs mentioned in `AGENTS.md`, or before running
dev/build/lint.

## Architecture

**Single Next.js project, App Router, no separate backend.** Server Components read
data directly; Server Actions mutate it. The only external dependency is Supabase
(Postgres + Auth), accessed via `@supabase/ssr`.

### Core principle: plan _methodology_ is code, plan _data_ is per-user Supabase rows

The 6-phase training methodology, the meal bank, and the exercise catalogs are
**hardcoded TypeScript constants** shared by every user — they're decisions made in
advance, not data that changes on its own. What's no longer hardcoded (since spec 004) is which calendar dates each phase occupies and whose profile/events drive the
calorie math — that's per-user data in `perfil`/`evento` (see
`specs/004-multi-user-onboarding/data-model.md`), read once per request via
`lib/user-plan.ts`'s `getUserPlanContext()`:

- `lib/training-plan.ts` — the weekly gym/run schedule content (`phase1Week`..
  `phase6Week`) is a fixed, shared 6-phase methodology (speed-building → endurance →
  recovery → race-specific build → taper → maintenance); `buildPlan(planStart,
events, today)` maps that content onto a specific user's own event dates (see
  `specs/004-multi-user-onboarding/research.md` Decision 1 for the algorithm).
  `getPhaseKeyForDate()` and `getSessionsForDate()` now take that user's computed
  `Week[]`/events instead of operating on module-level globals.
- `lib/meal-plan.ts` — the rotating meal bank and protein-reinforcement logic.
  `getMealsForDay(week, day, carbLoadWeeks, opts?)`: `opts.bank` is the user's own
  AI-generated bank (`plan_ia`), `opts.metaKcal` scales portions toward the day's
  calorie target, and `opts.pesoKg` scales the lunch-protein threshold. Called with no
  `opts`, it is byte-identical to the original plan (see `scripts/check-meal-scaling.mjs`
  and `specs/005-coach-ia/research.md` Decision 4).
- `lib/gym-exercises.ts` — gym/core routines keyed by `gymKey`/`coreKey` (shared default;
  a user's AI routines from `plan_ia` override gym keys in `ExerciseBlock`).
- `lib/calorie-target.ts` — Mifflin-St Jeor BMR, now taking a `UserProfile` (age,
  height, sex, activity factor, optional personal calibration) instead of one
  hardcoded `PERSONAL_DATA`/`INBODY_REFERENCE` pair — fixing a latent bug along the
  way (the old formula had no sex term at all).
- `lib/plan-content.ts` — static event/rules cards shown in the UI (shared, generic).

**`specs/004-multi-user-onboarding/` is implemented for its core scope** (US1-US3:
signup, onboarding, per-user plan generation, Brian's migration) — `lib/training-plan.ts`
and `lib/calorie-target.ts` no longer hold hardcoded-for-Brian constants; they take a
user's own profile/events (`lib/user-plan.ts`'s `getUserPlanContext()`) and compute
phases relative to those events (see `specs/004-multi-user-onboarding/research.md`
Decision 1 for how the spec's open design question was resolved). US4 (per-user
meal/exercise catalogs via AI) is implemented by **`specs/005-coach-ia/`**: the `/coach`
tab (chat + "generar y guardar" meal bank / gym routines into `plan_ia`), using Google
Gemini's free tier with no billing (`lib/ai.ts`, `GEMINI_API_KEY`) and a 20/day
per-user quota enforced in SQL (`consumir_uso_ia()`; the limit is hardcoded there on
purpose — read `specs/005-coach-ia/research.md` before touching it). US5 (full event
CRUD UI) is still open.

Day-to-day data (weight, calories, sleep, runs/walks, completed-day checkmarks, and
event results) lives in one flat table, `registro` (`categoria`, `fecha`, `valor`,
`nota`, `user_id`) — no foreign keys; "relations" (e.g. scheduled gym session vs.
completed) are resolved in application code by cross-referencing a user's computed
plan against their `registro` rows. See `specs/001-nextjs-migration/data-model.md`
for the full `categoria` enum and what `valor`/`nota` mean per category. Plan
_configuration_ (profile and events — what used to be hardcoded constants) lives in
`perfil`/`evento`, added by spec 004; see
`specs/004-multi-user-onboarding/data-model.md`.

### Routing and auth

- `app/(app)/` is the authenticated route group: `calendario`, `nutricion`,
  `estadisticas`, `coach`, sharing `app/(app)/layout.tsx` (nav + theme toggle). The
  old `mancuernas` tab was removed in spec 005.
- `app/login/` and `app/signup/` are public. `app/onboarding/` requires a session but
  not a completed profile. `app/page.tsx` and `proxy.ts` handle the redirect logic
  (logged-out → `/login`, logged-in without a completed profile → `/onboarding`,
  logged-in at `/` → `/calendario`).
- **Next.js 16 renamed `middleware.ts` to `proxy.ts`** — this is not a typo or a
  custom convention, it's current upstream Next.js. `proxy.ts` is regenerated/kept
  in sync by `next dev`; see `node_modules/next/dist/server/lib/generate-agent-files.js`.
  Don't reintroduce `middleware.ts`.
- Auth is Supabase Auth (email+password, public signup via `app/signup/`, protected
  by the same Turnstile + rate-limit pattern as login — see spec 004). Session lives
  in httpOnly cookies via `@supabase/ssr`.
- **Two-layer auth gate, both required**: `proxy.ts` (via `lib/supabase/proxy.ts`'s
  `createProxyClient`) redirects unauthenticated requests at the edge, but
  `research.md`/`plan.md` for spec 003 are explicit that the proxy is _not_
  sufficient alone (a matcher change or route refactor can silently drop
  coverage). Every data-mutating Server Action must independently call
  `getAuthedUser()` from `lib/supabase/auth.ts` and bail if there's no user —
  see `app/registro/actions.ts` and `app/(app)/nutricion/actions.ts` for the
  pattern. `registro` rows are also scoped by `user_id` + RLS policies
  (`specs/003-security-hardening/contracts/rls-migration.sql`) as defense in depth.
- In `createProxyClient`/`createClient` (`lib/supabase/proxy.ts`, `lib/supabase/server.ts`),
  nothing may run between `createServerClient(...)` and `supabase.auth.getUser()` —
  a stray async call in between can cause random logouts (Supabase's own caveat,
  noted inline in both files).
- `app/registro/actions.ts` has no corresponding `page.tsx`/route — it's a
  Server Actions module (`saveLog`, `deleteLog`, `toggleDayDone`) imported directly
  by components under `components/calendar-grid/` and `components/log-form/`, not a
  page itself.

### Validation and abuse protection

- All Server Action inputs are validated with `zod` schemas in
  `lib/validation/registro.ts` (`saveLogSchema`, `toggleDayDoneSchema`) — don't trust
  client input past this boundary even though there's only one legitimate user.
- `lib/rate-limit.ts` is an in-memory (per-process) rate limiter for `/login` and
  `saveLog`; it resets on redeploy/restart by design — see spec 003's
  `research.md` Decision 6 for why this ceiling was accepted rather than adding a
  backing store.
- `lib/turnstile.ts` verifies Cloudflare Turnstile server-side on login.

### Dates

Always use `lib/date.ts`'s `toISO`/`fromISO`/`todayNormalized`, never
`Date.toISOString()` or `new Date(isoString)` directly — those convert through UTC
and will shift the date by one, especially since the app's "today" is anchored to
`America/Argentina/Buenos_Aires`, not server UTC.

### UI

shadcn/ui components (`components/ui/`) use the `base-nova` style with `@base-ui/react`
primitives (not bare Radix), neutral base color, CSS variables — configured in
`components.json`. Tailwind v4 (no `tailwind.config.*`; see `app/globals.css` and
`postcss.config.mjs`). ESLint enforces `@typescript-eslint/no-explicit-any` as an
error (see `eslint.config.mjs`) — don't introduce implicit/explicit `any`.
