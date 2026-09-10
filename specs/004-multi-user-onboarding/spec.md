# Feature Specification: Multi-User Onboarding & Personalized Plan Generation

**Feature Branch**: `004-multi-user-onboarding`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "Multi-user onboarding: hoy la app Plan de Vida 2026 asume un solo usuario hardcodeado (yo, Brian) — los eventos, el plan de gimnasio y los targets de calorías/nutrición viven como constantes en lib/training-plan.ts, lib/calorie-target.ts y lib/meal-plan.ts, con fechas fijas de calendario. Necesito que cualquier persona pueda registrarse, completar un onboarding con sus propios datos y sus propios eventos (carreras y/o caminatas, con su propia fecha y distancia), y que a partir de eso TODO el plan de gimnasio, la nutrición y el target calórico se generen específicamente para esa persona. Mis propios datos actuales tienen que seguir produciendo exactamente el mismo resultado una vez migrados — soy el primer usuario del sistema nuevo, no un caso especial aparte. Es una feature pensada para escalar."

## Current State (confirmed against the codebase, not assumed)

- `lib/training-plan.ts` hardcodes: three fixed events (`EV_10K`, `EV_LUJAN`, `EV_21K`), a fixed plan window (`PLAN_START` 17/ago/2026 – `PLAN_END` 31/dic/2026), a fixed 6-phase methodology (velocity-building → endurance-transition → recovery → race-specific build → taper → year-end close), and per-phase weekly session definitions — all as module-level constants with no `user_id` dimension.
- `lib/calorie-target.ts` hardcodes one person's `PERSONAL_DATA` (age 28, height 180cm, sex "M", activity factor) and one InBody calibration reference point (`INBODY_REFERENCE`), used to calibrate a Mifflin-St Jeor BMR calculation for exactly one person.
- `lib/meal-plan.ts` hardcodes a single shared `mealBank` (recipes per meal type, with ingredient/protein data) used to generate every user's daily meals — there is currently no per-user meal content.
- `lib/gym-exercises.ts` hardcodes a single shared exercise catalog keyed by phase/routine (e.g. `empuje`, `inferior`, `tiron`) — there is currently no per-user exercise content.
- The `registro` table already has RLS scoped by `user_id` (spec 003) and Supabase Auth already exists for login — but today login only grants access to the single owner account; there is no public signup, no user profile table, and no per-user events/content tables.
- `proxy.ts` already gates all `(app)` routes behind an authenticated session; extending that gate to also require a completed onboarding step is additive to an existing, working mechanism.

## Open Design Question (deferred to `/speckit-plan` research — NOT resolved in this spec)

The single highest-risk unknown in this feature is **how to generalize the 6-phase training methodology from fixed calendar ranges to event-relative ranges**. Today, `lib/training-plan.ts` assigns each of the 6 phases a fixed number of weeks anchored to `PLAN_START` (a hardcoded calendar date). Once every user has their own set of events on their own dates, phase boundaries must instead be computed relative to "weeks until/since this user's own event(s)" — and several sub-questions remain genuinely open:

- How does the system pick which of a user's events is the "primary" one that anchors the 6-phase countdown, when a user has multiple events (e.g., a 10K in 3 weeks and a marathon in 4 months)?
- What happens when the time remaining before a user's nearest event is shorter than the 6-phase methodology needs (e.g., someone signs up 2 weeks before their race)? Do phases compress proportionally, does the system skip early phases, or something else?
- How are the gaps _between_ a user's events handled (e.g., an 8-week "maintenance/closeout" phase today is calendar-bound to Nov 8–Dec 31; for a user whose events are spread differently, what fills the time between events)?
- Does the phase methodology itself (the specific 6 phase types, their relative week-lengths, and per-phase weekly session structure) stay fixed for every user, or does it also need to flex based on event type/distance (e.g., a 5K goal vs. an 80km walk goal)?

This spec intentionally defines the **required outcome** (FR-006 below) without prescribing the mechanism. The mechanism is planning-phase work, to be resolved with explicit design options and trade-offs in `research.md` before implementation begins.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Anyone can sign up and complete onboarding (Priority: P1)

A new visitor creates an account with an email and password (no invitation required) and then completes an onboarding flow that captures their personal profile (age, height, sex, current weight, body-composition goal) and at least one event they're training for (a race or a walk, with its own name, date, and distance).

**Why this priority**: Without a working signup + onboarding gate, there is no way to acquire a second user or capture the inputs every other part of this feature depends on. This is the entry point for the whole feature.

**Independent Test**: Sign up with a new email, complete the onboarding form with profile data and one event, and confirm the account can then reach the plan-dependent pages (Calendario, Nutrición, Estadísticas) instead of being redirected back to onboarding.

**Acceptance Scenarios**:

1. **Given** no account exists for an email, **When** a visitor submits the signup form with that email and a password, **Then** an account is created and the visitor is guided into onboarding.
2. **Given** a newly created account that hasn't finished onboarding, **When** that user tries to visit Calendario, Nutrición, or Estadísticas, **Then** they are redirected to onboarding instead of seeing a plan.
3. **Given** a user completes onboarding with valid profile data and at least one event, **When** onboarding is submitted, **Then** the account is marked onboarded and the user can reach all plan-dependent pages.
4. **Given** a user attempts to submit onboarding with no events at all, **When** they submit, **Then** the system rejects the submission and asks for at least one event.

---

### User Story 2 - The gym plan and calorie target are generated from the user's own data (Priority: P1)

Once onboarded, a user sees a weekly gym plan and a daily calorie target that are computed from their own profile and their own events — not from the previously hardcoded constants.

**Why this priority**: This is the core value of the feature: a plan that means something for the person looking at it, not a copy of the original owner's plan.

**Independent Test**: Onboard two different accounts with different profiles and different event dates, and confirm each sees a different weekly gym plan and a different calorie target, each consistent with their own inputs.

**Acceptance Scenarios**:

1. **Given** a user's own event dates, **When** they view Calendario for any week, **Then** the sessions shown reflect a training phase computed relative to that user's own events, not a fixed calendar date range.
2. **Given** a user's own profile (age, height, sex, weight) and, optionally, a personal calibration reference point, **When** their calorie target is calculated, **Then** it uses that user's own BMR calculation, not another user's data.
3. **Given** a user's own current training phase, **When** their calorie deficit target is calculated, **Then** it uses the deficit value associated with that user's current phase.
4. **Given** two different onboarded users, **When** each views their own Calendario/Nutrición/Estadísticas, **Then** neither ever sees a session, meal, or target derived from the other user's data.

---

### User Story 3 - The existing owner's plan is preserved exactly after migration (Priority: P1)

The app's current single owner (Brian) becomes the first user of the new multi-user system — his existing events (10K, Luján 80km, 21K), his existing 6-phase Aug–Dec 2026 plan, his existing meal bank, and his existing exercise catalog are migrated into the new per-user data model and continue to produce the same day-by-day output as before.

**Why this priority**: This is the regression gate for the only real user and real historical data the system has today. If this breaks, the feature has made the app worse for its only current user while adding a capability nobody has used yet.

**Independent Test**: For a sample of dates across the existing Aug 17 – Dec 31 2026 range, compare the gym session, assigned meals, and calorie target shown before this feature ships against the same dates after migration — every value must match exactly.

**Acceptance Scenarios**:

1. **Given** the owner's account after migration, **When** any date in the previously fixed Aug 17 – Dec 31 2026 range is viewed in Calendario, **Then** the gym session shown is identical to what the app showed for that date before this feature.
2. **Given** the owner's account after migration, **When** any weekday in that range is viewed in Nutrición, **Then** the assigned meals and total protein are identical to what the app showed before this feature.
3. **Given** the owner's account after migration, **When** the calorie target is calculated for any date in that range, **Then** it matches the value the app produced before this feature (same BMR calibration, same deficit-by-phase).
4. **Given** the owner's pre-existing `registro` history (weight, sleep, calories, walks, runs, completed days), **When** migration completes, **Then** none of that history is lost, altered, or reassigned to a different account.

---

### User Story 4 - Each user defines their own meals and gym exercises (Priority: P2)

Beyond profile and events, a user can create, edit, and remove their own meal entries (per meal type: desayuno, media mañana, almuerzo, merienda, cena — each with ingredients and quantities) and their own gym exercise catalog (per training routine, e.g. push/pull/legs), instead of relying on a single shared catalog.

**Why this priority**: This is the deeper personalization layer on top of the core plan-generation engine (User Story 2); a user can already get a working plan from User Story 2 using reasonable starting content, so this can ship slightly after the core engine without blocking it.

**Independent Test**: As an onboarded user, add a new meal entry with its ingredients, confirm it can now be assigned as part of that user's own plan, then remove it and confirm it stops appearing.

**Acceptance Scenarios**:

1. **Given** an onboarded user, **When** they add a new meal with a name, meal type, and ingredients/quantities, **Then** it becomes available for that user's own meal rotation only.
2. **Given** an onboarded user, **When** they add a new gym exercise entry under one of their routine categories, **Then** it becomes available for that user's own gym plan only.
3. **Given** a user edits or removes one of their own meals or exercises, **When** the change is saved, **Then** their future plan reflects the change, and no other user's plan is affected.
4. **Given** a brand-new account that has not yet added any custom meals/exercises, **When** they finish onboarding, **Then** they still have a usable starting set of meals/exercises rather than an empty plan.

---

### User Story 5 - Users manage their events over time (Priority: P3)

After onboarding, a user can add a new event, edit an existing one (date, distance, name), or remove one they no longer plan to do — for example, adding a 2027 event once their current ones are done.

**Why this priority**: Valuable for long-term retention and for the "designed to scale" goal, but not required for the initial personalized-plan experience to work — a user can already train toward the event(s) captured at onboarding.

**Independent Test**: As an onboarded user with one event, add a second event with a later date, and confirm the plan recalculates to account for both; remove an event and confirm the plan recalculates without it.

**Acceptance Scenarios**:

1. **Given** an onboarded user, **When** they add a new event, **Then** it is saved and considered in their plan going forward.
2. **Given** an onboarded user with an upcoming event, **When** they edit that event's date or distance, **Then** their plan recalculates using the updated value.
3. **Given** an onboarded user whose only event is removed, **When** the removal is confirmed, **Then** the system shows a clear "no upcoming event" state instead of an error or a stale plan.

---

### Edge Cases

- What happens when a user has multiple events at once (e.g., a 10K in 3 weeks and a marathon in 4 months)? → Covered by the Open Design Question above; not resolved in this spec.
- What happens when a user's nearest event is very close (e.g., they sign up 2 weeks before it)? → Covered by the Open Design Question above; not resolved in this spec.
- What happens once a user's last known event has passed and none is scheduled? → The system shows a clear "no upcoming event" state (consistent with the existing landing-page pattern for the current fixed plan) rather than an error, and prompts the user to add a new event.
- What happens if two different users happen to register for the same real-world event (same name/date)? → Each user's event is independent data; no deduplication or shared-event logic is implied.
- What happens if a user logs in but never finishes onboarding? → They are redirected to onboarding instead of the plan-dependent pages, consistent with the existing authentication gate in `proxy.ts`.
- What happens to a user's plan while they have zero custom meals/exercises defined (right after signup)? → They start from a default starter set (see FR-008a) so the plan is never empty, and can replace it over time.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow any visitor to create an account through a public signup form (email and password), with no invitation code or manual approval required.
- **FR-002**: System MUST protect the public signup form against automated/bot abuse, using the same category of protection (bot challenge + rate limiting) already applied to login in spec 003.
- **FR-003**: System MUST require every new account to complete onboarding — capturing age, height, sex, current weight, a body-composition goal, and at least one event — before granting access to any plan-dependent page (Calendario, Nutrición, Estadísticas).
- **FR-004**: System MUST reject onboarding submissions that contain zero events.
- **FR-005**: Users MUST be able to add any number of events, each with its own type (race or walk), name, date, and distance — not limited to a fixed count.
- **FR-006**: System MUST compute each user's current training phase and weekly gym schedule relative to that user's own event(s), producing the same category of week-by-week structure the app produces today, without depending on any fixed calendar date. (The exact computation mechanism is the Open Design Question above — out of scope to resolve here.)
- **FR-007**: System MUST calculate each user's daily calorie target from that user's own profile (Mifflin-St Jeor BMR from age/height/sex/weight), optionally calibrated against that user's own reference measurement when the user provides one, combined with that user's own logged active-calorie data when available, and adjusted by a deficit tied to that user's current training phase.
- **FR-008**: Users MUST be able to create, edit, and remove their own meal entries (per meal type, with ingredients and quantities) and their own gym exercise catalog entries (per routine category).
- **FR-008a**: Every new account MUST start with a usable default set of meals and gym exercises (seeded from the current shared content) so a plan can be generated immediately after onboarding, even before the user customizes anything.
- **FR-009**: System MUST calculate each user's daily protein total and low-protein reinforcement behavior using that user's own meal definitions, following the same reinforcement logic the app uses today (reinforce breakfast, then merienda, then cena, when lunch protein is below threshold).
- **FR-010**: System MUST continue to isolate every `registro` row by `user_id` exactly as established in spec 003; this feature MUST NOT weaken or bypass that isolation.
- **FR-011**: System MUST extend the same per-user isolation model to all new data introduced by this feature (profile, events, meals, exercise catalog) — a user MUST NOT be able to read or modify another user's profile, events, meals, or exercise entries.
- **FR-012**: System MUST migrate the current hardcoded owner data (events, the 6-phase Aug–Dec 2026 plan, the shared meal bank, the shared exercise catalog) into this per-user model for the existing owner account, with no change to that owner's existing `registro` history.
- **FR-013**: For every date in the previously fixed Aug 17 – Dec 31 2026 range, the migrated owner account MUST produce the same gym session, meal assignment, and calorie target the app produced for that date before this feature.
- **FR-014**: Users MUST be able to edit or remove an event after onboarding, with the plan recalculating from the updated event data.

### Key Entities

- **User Profile**: One per account — age, height, sex, current weight (initial value; ongoing weight comes from existing `registro` "peso" logs), body-composition goal, and an optional personal calibration reference point (measured BMR at a given weight) used the same way the current single-user calibration is used today.
- **User Event**: A race or walk a user is training for — type, name, date, distance, owned by exactly one user. Replaces the three hardcoded events; a user may have any number of these.
- **Training Phase (derived, per user)**: Not a stored table by itself — the current phase (one of the fixed 6 phase types) and the date range it covers for a given user, computed from that user's events. The computation mechanism is the Open Design Question above.
- **User Meal**: One recipe-like entry owned by a user — meal type (desayuno/media/almuerzo/merienda/cena), name, ingredients with quantities, and the same optional tags the current shared bank uses (carb-load, "liviana"). Replaces the single shared `mealBank` as the source for that user's plan.
- **User Exercise Catalog Entry**: One gym exercise/routine entry owned by a user, keyed to a routine category (e.g., push/pull/legs/core). Replaces the single shared exercise catalog as the source for that user's plan.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A new visitor can go from landing on the signup form to having a visible, personalized plan (profile + at least one event submitted) in under 5 minutes.
- **SC-002**: 100% of plan-dependent pages (Calendario, Nutrición, Estadísticas), across every onboarded account tested, show content derived only from that account's own profile/events/meals/exercises — zero instances of one user seeing another user's plan data.
- **SC-003**: For the migrated owner account, 100% of sampled dates in the previous Aug 17 – Dec 31 2026 range produce identical gym session, meal assignment, and calorie target output compared to the pre-migration app.
- **SC-004**: A user can add, edit, or remove an event, a meal, or an exercise entry, and see it reflected in their own plan without any code change or developer involvement — 100% self-service.
- **SC-005**: The system supports at least 20 concurrent onboarded accounts with no cross-account data leakage and no noticeable slowdown, consistent with the "share with a small group first, built to scale later" rollout plan.

## Assumptions

- Signup is fully open (no invitation code, no manual approval) per explicit decision — abuse risk is mitigated by reusing the existing bot-challenge + rate-limit pattern from spec 003 (FR-002), not by gating who can sign up.
- Every user defines their own meal bank and gym exercise catalog (not a shared catalog with per-user targets only) per explicit decision; new accounts still start from a seeded default (FR-008a) so onboarding never produces an empty plan.
- The fixed 6-phase training _methodology_ (the specific phase types, their order, and the weekly session structure within each) is assumed to remain the same system-wide template for every user; what changes per user is which calendar dates each phase occupies, computed relative to that user's own events. Whether the methodology itself should also flex per event type/distance is part of the Open Design Question above.
- The existing `registro` table and its RLS-by-`user_id` model (spec 003) are reused as-is for activity logs; this feature only adds new tables/columns for profile, events, meals, and exercise catalog entries — per the project constitution, any such schema change requires explicit approval, which this spec constitutes for the entities listed in Key Entities.
- The existing authentication session mechanism (Supabase Auth + `proxy.ts` gate) is reused and extended with an "onboarding completed" check, rather than replaced.
- A personal BMR calibration reference point (like the current InBody measurement) is optional per user, not required to complete onboarding — users without one still get a Mifflin-St Jeor estimate.
- No dedicated admin/moderation tooling (e.g., banning accounts, reviewing signups) is in scope for this feature, consistent with the "small group first" rollout being informal rather than access-controlled.
