# Tasks: Security Hardening & Pre-Deploy Checks

**Input**: Design documents from `/specs/003-security-hardening/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested for this feature (no test framework in repo, per research.md Decision 10). Validation is manual via `quickstart.md`, included as explicit tasks at the end of each story.

**Route note**: `spec.md` names "Registro" as one of the protected pages, but the codebase has no standalone `/registro` route — its cards/forms are rendered inside `app/estadisticas/page.tsx`, and `app/page.tsx` redirects `/` to `/calendario`. Tasks below protect the real routes: `/`, `/calendario`, `/estadisticas`, `/nutricion`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: Maps the task to spec.md's US1–US6

---

## Phase 1: Setup

- [X] T001 Add `zod` as a dependency: `npm install zod` (research.md Decision 4)
- [X] T002 [P] Remove the two legacy tracked files from the working tree and add them to `.gitignore`: `git rm --cached "Deploy_V1/plan_vida_2026 copy.html" plan_vida_2026.html`, then add `Deploy_V1/` and `plan_vida_2026.html` to `.gitignore` (FR-018, research.md Decision 8)
- [X] T003 Manual (owner, Supabase dashboard): create the single Supabase Auth user (email + password) and record its `id` (uuid) from `auth.users` — required before T007 can run

**Checkpoint**: Setup done. T003's UUID is a hard prerequisite for the RLS migration in Phase 3 (US1).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server-side Supabase session plumbing shared by every authenticated server action and by the login gate. No user story can be completed without this.

- [X] T004 Rewrite `lib/supabase/server.ts` to sync real session cookies via Next.js's `cookies()` (App Router server components/actions), replacing the current `getAll: () => []` / `setAll: () => {}` stub (research.md Decision 2)
- [X] T005 [P] Create `lib/supabase/proxy.ts` exporting a `createServerClient` configured for use inside `proxy.ts`, reading/writing cookies via `NextRequest`/`NextResponse` per the documented `updateSession` pattern (research.md Decision 2)
- [X] T006 [P] Create `lib/supabase/auth.ts` exporting `getAuthedUser()`, a shared helper that resolves the current session's user (or `null`) from the server Supabase client, for use by every data-modifying server action (research.md Decision 5, `contracts/auth-actions.md`)

**Checkpoint**: Foundation ready — US1, US2, US3 can now proceed.

---

## Phase 3: User Story 1 - Personal data is no longer publicly writable (Priority: P1) 🎯 MVP

**Goal**: `registro` rows are scoped to the owner; nothing succeeds against the table using only the anon key without a session.

**Independent Test**: Query `registro` with only the anon key and no session (`select`/`insert`/`delete`) — all rejected. Logged-in owner still reads/writes their own rows, including pre-existing ones.

### Implementation for User Story 1

- [X] T007 [US1] Apply `contracts/rls-migration.sql` against the Supabase project: fill `<OWNER_UUID>` with the id from T003, run via the SQL Editor (adds `user_id`, backfills, replaces the "Permitir todo con anon key" policy with 4 owner-scoped policies) — depends on T003
- [X] T008 [US1] Update `app/registro/actions.ts` (`saveLog`, `deleteLog`): call `getAuthedUser()` from `lib/supabase/auth.ts` and return `{ ok: false, message: "No autenticado" }` if absent; scope every query with `.eq("user_id", user.id)` (insert sets `user_id: user.id`) — depends on T004, T006, T007
- [X] T009 [US1] Update `app/calendario/actions.ts` (`toggleDayDone`): same `getAuthedUser()` check and `user_id` scoping as T008 — depends on T004, T006, T007
- [X] T010 [US1] Run `quickstart.md` US1 steps: confirm anon-key-only access is rejected and the owner's pre-existing rows are still visible after the migration — depends on T007, T008, T009

**Checkpoint**: `registro` is no longer publicly accessible. This is the MVP — the highest-risk gap is closed even before login UI exists (data is unreachable without a valid session, and no session-issuing UI exists yet, so effectively unreachable end-to-end).

---

## Phase 4: User Story 2 - Owner logs in before seeing any personal data (Priority: P1)

**Goal**: No app page renders personal data without an authenticated session; login is server-enforced.

**Independent Test**: Unauthenticated visit to any protected page redirects to `/login`. Correct credentials grant access and persist across reloads; wrong credentials are rejected; repeated failures are throttled.

### Implementation for User Story 2

- [X] T011 [P] [US2] Create `lib/rate-limit.ts`: in-memory IP-keyed counter with a time window, exposing a check/increment function for the login action (research.md Decision 6 — `# ponytail` ceiling comment required)
- [X] T012 [US2] Create `app/login/actions.ts` with `login({ email, password, turnstileToken })` and `logout()` per `contracts/auth-actions.md` — validates input, checks T011's rate limiter, calls `supabase.auth.signInWithPassword` / `signOut` via the server client — depends on T004, T005, T011 (Turnstile verification wired in T030; stub-accept the token field for now so the action is functional before US6)
- [X] T013 [US2] Create `app/login/page.tsx`: email/password form calling `login()`, styled via the existing shadcn/`@base-ui/react` components (Constitution Principle III) — **no "sign up" link, no "forgot password" / reset flow, no other account affordance** (FR-002) — depends on T012
- [X] T014 [US2] Create `proxy.ts` at the repository root (NOT `middleware.ts` — deprecated in this Next.js version, research.md Decision 1): use `lib/supabase/proxy.ts`'s client to call `supabase.auth.getUser()` and redirect to `/login` when absent, for all routes except `/login`; exclude static assets via `config.matcher` — depends on T005
- [X] T015 [US2] Run `quickstart.md` US2 steps: unauthenticated redirect on `/`, `/calendario`, `/estadisticas`, `/nutricion`; successful login persists across reload; wrong credentials rejected; rate limit trips after repeated failures — depends on T011–T014

**Checkpoint**: US1 + US2 together close the full P0/P1 exposure — no personal data is reachable without a valid, server-verified login.

---

## Phase 5: User Story 3 - Safe to deploy: validated input & confirmations (Priority: P2)

**Goal**: Malformed input is rejected server-side before reaching Supabase; destructive actions require confirmation.

**Independent Test**: Submit `saveLog`/`toggleDayDone` with invalid input directly — rejected, no row changed. Trigger a delete in the UI — confirmation required first.

### Implementation for User Story 3

- [X] T016 [P] [US3] Create `lib/validation/registro.ts`: `zod` schemas for `saveLog`/`toggleDayDone` inputs per the validation rules in `data-model.md` (categoria enum from `lib/types.ts`'s `Categoria`, valid ISO `fecha`, finite in-range `valor`, bounded-length optional `nota`)
- [X] T017 [US3] `app/registro/actions.ts`: parse input through T016's schema before querying Supabase, return `{ ok: false, message }` on failure — depends on T016, T008
- [X] T018 [US3] `app/calendario/actions.ts`: same validation for `toggleDayDone`'s `fecha` — depends on T016, T009
- [X] T019 [US3] Audit destructive actions beyond the already-confirmed `components/log-form/delete-log-button.tsx` (FR-009 already satisfied there); check `components/calendar-grid/calendar-grid.tsx`'s day-toggle for any irreversible action needing the same confirm-dialog pattern and add it if found
- [X] T020 [US3] Run `quickstart.md` US3 steps: malformed/out-of-range input rejected server-side; delete requires confirmation — depends on T017–T019

**Checkpoint**: US1–US3 complete — data access, auth, and input integrity are all closed.

---

## Phase 6: User Story 4 - Deploy previews and search engines don't leak or index the wrong thing (Priority: P2)

**Goal**: Netlify preview URLs are `noindex`; production pages have canonical URLs, one `<h1>`, and a proper share preview.

**Independent Test**: A simulated preview-deploy request returns `noindex`; production pages don't; each page declares its own canonical URL; a shared production link renders a title/description/image card.

### Implementation for User Story 4

- [X] T021 [P] [US4] Create/update `app/robots.ts`: emit a disallow-all / `noindex` directive when the Netlify build context indicates a deploy preview (e.g. `process.env.CONTEXT !== "production"`), otherwise the normal permissive robots rule (research.md Decision 9)
- [X] T022 [P] [US4] Update `app/layout.tsx`'s `metadata` export: add `openGraph` (title, description, `images`) and a default `robots` value consistent with T021's per-environment logic
- [X] T023 [US4] Add/confirm per-page `metadata` (`alternates.canonical`, exactly one `<h1>`) on `app/calendario/page.tsx`, `app/estadisticas/page.tsx`, `app/nutricion/page.tsx` (calendario/estadisticas already have `metadata` + `h1` — verify and add `alternates.canonical`; nutricion needs both checked)
- [X] T024 [US4] Add an og:image asset under `public/` and reference it from T022's `openGraph.images`
- [X] T025 [US4] Run `quickstart.md` US4 steps: preview build shows `noindex`, production build doesn't, canonical/h1 present, link preview renders — depends on T021–T024

**Checkpoint**: US1–US4 complete — security plus SEO/sharing correctness.

---

## Phase 7: User Story 5 - Clean, accessible pages with no regressions (Priority: P3)

**Goal**: Zero console errors/warnings, all images have alt text, previously built interactions (hover, loading, mobile menu) still work.

**Independent Test**: Open each page with dev tools — empty console. Inspect every image — alt text present. Exercise mobile drawer/hover/loading states — unchanged from before this feature.

### Implementation for User Story 5

- [X] T026 [P] [US5] Audit every `<img>`/icon usage across `app/` and `components/` for missing or non-descriptive `alt`; fix each one found
- [X] T027 [US5] Load each of the 4 protected pages plus `/login` with dev tools open; fix any console error/warning surfaced (including any introduced by this feature's own changes)
- [X] T028 [US5] Manually exercise the mobile drawer, sidebar hover states, and loading animations from 002-frontend-redesign on each page; confirm no regression from this feature's changes (proxy redirect, new login page, metadata changes)

**Checkpoint**: US1–US5 complete.

---

## Phase 8: User Story 6 - Infrastructure is hardened for public exposure (Priority: P4)

**Goal**: HTTPS enforced, `/login` resists bots, no raw-concatenated SQL anywhere.

**Independent Test**: Plain-HTTP request redirects to HTTPS. Scripted login POSTs without a valid Turnstile token are rejected before Supabase Auth runs. No `.rpc()`/string-built query exists in the codebase.

### Implementation for User Story 6

- [X] T029 [P] [US6] Confirm Netlify's default HTTPS redirect is active for this site (check dashboard/domain settings); add an explicit redirect rule (e.g. `netlify.toml`) only if the default isn't already enforced
- [X] T030 [US6] Add the Cloudflare Turnstile widget to `app/login/page.tsx` (client `<script>`, no new npm dependency) and wire server-side `siteverify` verification into `app/login/actions.ts`'s `login()` (replacing T012's stub-accept), rejecting before `signInWithPassword` runs (research.md Decision 7) — depends on T012, T013
- [X] T031 [P] [US6] Grep the codebase for `.rpc(` and any string-concatenated SQL in server actions/lib; confirm none exist (documentation/verification task — no code change expected given current `actions.ts` files use the query builder exclusively)
- [X] T032 [US6] Run `quickstart.md` US6 steps: HTTP→HTTPS redirect, bot-token rejection, no raw SQL — depends on T029–T031

**Checkpoint**: All 6 user stories complete.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [X] T033 [P] Confirm no `NEXT_PUBLIC_`-prefixed env var or client bundle exposes a `service_role`/elevated key (FR-007): review `.env.local`, `next.config.ts`, and `grep -r "NEXT_PUBLIC_" .env.local`
- [X] T034 [P] Run `next build` and review the per-route bundle size report for anything unusually large, given the new `/login` route and `zod` dependency
- [X] T035 Run the full `quickstart.md` "Pre-deploy sign-off checklist" end-to-end before the Netlify deploy

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. T003 (manual Supabase user creation) blocks T007.
- **Foundational (Phase 2)**: Depends on Setup — blocks US1, US2, US3.
- **US1 (Phase 3)**: Depends on Foundational + T003/T007. Independently testable as soon as T007–T009 land (MVP).
- **US2 (Phase 4)**: Depends on Foundational. Independent of US1's completion, though both are P1 and typically land together for the app to be safely public.
- **US3 (Phase 5)**: Depends on Foundational + US1's `actions.ts` edits (T008/T009) since it edits the same files.
- **US4 (Phase 6)**: Depends only on Foundational — independent of US1–US3, can run in parallel with them.
- **US5 (Phase 7)**: Best done last since it audits the cumulative UI/console state of all prior changes, but individual tasks (T026 alt-text audit) can start anytime.
- **US6 (Phase 8)**: T030 depends on US2's `app/login/*` existing (T012, T013). T029/T031 are independent.
- **Polish (Phase 9)**: Depends on all desired stories being complete.

### Parallel Opportunities

- T002 (git rm --cached) can run alongside T001 (npm install zod).
- T005 and T006 (Phase 2) touch different new files — parallel.
- T011 (rate-limit) is independent of T008/T009 — can run alongside US1 implementation.
- US4's T021/T022 are independent of US1–US3 entirely — a second work-stream can start Phase 6 as soon as Phase 2 is done.
- T026 (alt-text audit) and T031 (SQL-injection grep) can run anytime, independent of everything else.

---

## Parallel Example: Foundational + early story work

```bash
# After Setup (Phase 1):
Task: "Create lib/supabase/proxy.ts client for proxy.ts (T005)"
Task: "Create lib/supabase/auth.ts getAuthedUser() helper (T006)"

# Once Phase 2 is done, these can run in parallel work-streams:
Task: "US1: apply contracts/rls-migration.sql + scope actions.ts (T007-T009)"
Task: "US2: build login flow + proxy.ts gate (T011-T014)"
Task: "US4: robots.ts + metadata (T021-T024)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1).
2. **STOP and VALIDATE** with `quickstart.md` US1: confirm the anon key alone can no longer touch `registro`.
3. This alone closes the single highest-risk finding from the P0 investigation, even before `/login` exists.

### Incremental Delivery

1. Setup + Foundational → US1 (MVP: data locked down) → US2 (login gate, completes P1) → US3 (input integrity) → US4 (SEO/sharing) → US5 (polish/accessibility) → US6 (infra hardening) → Polish.
2. Each checkpoint is independently deployable/demoable; US1+US2 together are the minimum bar for a safe public Netlify deploy.

---

## Notes

- [P] tasks touch different files with no unmet dependency.
- Every schema-touching task (T007) references `contracts/rls-migration.sql`, the artifact carrying the Principle-IV-approved SQL — no other `ALTER`/`DROP` is in scope.
- Commit after each task or logical group, per repository convention.
