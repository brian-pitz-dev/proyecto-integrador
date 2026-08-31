# Phase 1 Data Model: Security Hardening & Pre-Deploy Checks

## Entities

### Owner (Supabase Auth user)

Not a new table — this is a row in Supabase's built-in `auth.users`, created manually by the owner via the dashboard (per spec Assumptions, no self-registration flow is built).

| Field | Source | Notes |
|---|---|---|
| `id` (uuid) | `auth.users.id` | The value every `registro.user_id` foreign key points to |
| `email` | `auth.users.email` | Used for login form |

### Registro (existing table, modified)

Schema change to the existing `public.registro` table (Constitution Principle IV — schema change explicitly approved by the user's originating request for this feature).

| Column | Type | Change |
|---|---|---|
| `id` | uuid | unchanged |
| `categoria` | text | unchanged |
| `fecha` | date | unchanged |
| `valor` | numeric | unchanged |
| `nota` | text | unchanged |
| `created_at` | timestamp with time zone | unchanged |
| `user_id` | uuid, `references auth.users`, `not null` | **NEW** — added with a default so existing rows can be backfilled to the owner's single `auth.users.id` before the `not null` constraint and RLS policies are applied |

**Validation rules** (enforced by the `zod` schema in server actions, before any Supabase call — Decision 4 in research.md):
- `categoria`: non-empty string, one of the values already used by the app (`peso`, `ejercicio`, `sueño`, `completado`, etc. — enumerate from current usages in `app/*/actions.ts` and `lib/types.ts` at implementation time, do not invent new categories).
- `fecha`: valid ISO date string.
- `valor`: finite number within the range already implied by existing UI inputs (e.g., no negative weight).
- `nota`: optional string, reasonable max length (e.g., 500 chars) to prevent abuse.

**RLS policies** (replacing the single "Permitir todo con anon key" policy — see research.md Decision 3):
- `select`: `(select auth.uid()) = user_id`
- `insert`: `with check ((select auth.uid()) = user_id)`
- `update`: `using ((select auth.uid()) = user_id)`
- `delete`: `using ((select auth.uid()) = user_id)`

### Session (no new table — Supabase Auth + cookies)

Not a persisted application entity. Represented by the httpOnly cookies Supabase's `@supabase/ssr` sets/reads (Decision 2). No new state to model beyond what `@supabase/ssr` already manages.

### Login rate-limit counter (in-memory, not persisted)

Ephemeral, process-local state for FR-008 (Decision 6) — not a database entity.

| Field | Notes |
|---|---|
| key | client IP (or a reasonable proxy for origin, e.g. `x-forwarded-for`) |
| count | failed attempts within the current window |
| windowStart | timestamp the current window began |

`# ponytail: process-local map, lost on restart/cold start, not shared across instances — acceptable ceiling for a single-instance deploy; documented in research.md Decision 6.`

## State Transitions

- **Registro row lifecycle**: unchanged (`insert` → optionally `update`/`delete` via existing actions) — only the *authorization* boundary around each transition changes (must now belong to the authenticated `user_id`).
- **Session lifecycle**: anonymous → authenticated (login) → authenticated (persisted across reloads via cookie) → anonymous (logout or cookie/session expiry, triggering proxy redirect to `/login`).
