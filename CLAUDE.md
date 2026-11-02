# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

"Plan de Vida 2026" — a personal Next.js app for one user (Brian) to track training
(running/gym), nutrition, and progress toward three 2026 events (a 10K, the 80km
Luján procession, and a 21K). It's a migration of a static `plan_vida_2026.html`
(not in this repo — excluded via `.gitignore`), preserving its logic 1:1 while
moving storage to Supabase and the UI to Next.js + shadcn/ui.

Read `README.md` for the product framing and `specs/*/spec.md` + `plan.md` for the
history of *why* things are built the way they are — this repo uses a spec-driven
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

### Core principle: plan content is code, user data is Supabase

The training plan, meal plans, and exercise catalogs are **hardcoded TypeScript
constants**, not database rows — they're decisions made in advance, not data that
changes on its own:

- `lib/training-plan.ts` — the weekly gym/run schedule, keyed off fixed calendar
  dates (`PLAN_START`/`PLAN_END` and three hardcoded event dates) and a 6-phase
  methodology (speed-building → endurance → recovery → race-specific build →
  taper → maintenance). `getPhaseKeyForDate()` and `getSessionsForDate()` are the
  main entry points other modules call.
- `lib/meal-plan.ts` — the rotating meal bank and protein-reinforcement logic.
- `lib/gym-exercises.ts` / `lib/dumbbell-exercises.ts` — exercise catalogs keyed by
  routine/phase.
- `lib/calorie-target.ts` — Mifflin-St Jeor BMR calibrated against one hardcoded
  InBody measurement (`PERSONAL_DATA`, `INBODY_REFERENCE`), with a per-phase
  calorie deficit table.
- `lib/plan-content.ts` — static event/rules cards shown in the UI.

**`specs/004-multi-user-onboarding/spec.md` is a draft spec (not yet implemented)**
to generalize all of the above away from hardcoded-for-Brian constants into
per-user data. If you're asked to work on onboarding, multi-tenancy, or making the
plan "someone else's," read that spec first — it documents the open design
questions (e.g., how phases anchor to a user's own event dates) explicitly left
unresolved.

The only thing persisted in Supabase is what actually changes day-to-day: weight,
calories, sleep, runs/walks, completed-day checkmarks, and event results — all in
one flat table, `registro` (`categoria`, `fecha`, `valor`, `nota`, `user_id`). There
are no foreign keys; "relations" (e.g. scheduled gym session vs. completed) are
resolved in application code by cross-referencing the static plan against
`registro` rows. See `specs/001-nextjs-migration/data-model.md` for the full
`categoria` enum and what `valor`/`nota` mean per category.

### Routing and auth

- `app/(app)/` is the authenticated route group: `calendario`, `nutricion`,
  `estadisticas`, `mancuernas`, sharing `app/(app)/layout.tsx` (nav + theme toggle).
- `app/login/` is public. `app/page.tsx` and `proxy.ts` handle the redirect logic
  (logged-out → `/login`, logged-in at `/` → `/calendario`).
- **Next.js 16 renamed `middleware.ts` to `proxy.ts`** — this is not a typo or a
  custom convention, it's current upstream Next.js. `proxy.ts` is regenerated/kept
  in sync by `next dev`; see `node_modules/next/dist/server/lib/generate-agent-files.js`.
  Don't reintroduce `middleware.ts`.
- Auth is Supabase Auth (email+password, single owner, no public signup — that's
  what spec 004 would add). Session lives in httpOnly cookies via `@supabase/ssr`.
- **Two-layer auth gate, both required**: `proxy.ts` (via `lib/supabase/proxy.ts`'s
  `createProxyClient`) redirects unauthenticated requests at the edge, but
  `research.md`/`plan.md` for spec 003 are explicit that the proxy is *not*
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
