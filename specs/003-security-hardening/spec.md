# Feature Specification: Security Hardening & Pre-Deploy Checks

**Feature Branch**: `003-security-hardening`

**Created**: 2026-08-31

**Status**: Draft

**Input**: User description: "Antes del deploy en Netlify necesito cerrar seguridad, login y una serie de chequeos técnicos/SEO que quedaron pendientes."

## Investigation Findings (confirmed against live Supabase project, not assumed)

- Single table `registro` in `public` schema (columns: `id`, `categoria`, `fecha`, `valor`, `nota`, `created_at`) — **no `user_id` column exists**.
- Row Level Security is enabled on `registro`, but the only policy is **"Permitir todo con anon key"** (command `ALL`, role `public`) — in practice this is equivalent to no access control: anyone holding the anon key can read, write, or delete every row.
- No authentication is implemented today. `lib/supabase/server.ts` stubs session cookies (`getAll: () => []`, `setAll: () => {}`) with an explicit comment stating there is no auth at this stage.
- No users exist yet in Supabase Auth.
- The anon/publishable key is hardcoded in two legacy tracked files (`plan_vida_2026.html`, `Deploy_V1/plan_vida_2026 copy.html`). This key is public by design (meant to be protected by RLS, not secrecy) — no rotation is required, but it makes closing the RLS gap above urgent.
- No `service_role` key or other real secret was found committed anywhere in git history (the entire history is a single commit).
- The two legacy files above are already tracked by git; adding them to `.gitignore` alone will not remove them from the working tree or history.
- `@supabase/ssr` and `@supabase/supabase-js` are already installed dependencies; no `middleware.ts` exists yet.
- App routes: `/registro`, `/calendario`, `/estadisticas`, `/nutricion`.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Personal data is no longer publicly writable (Priority: P1)

As the app's owner, my `registro` records (weight, exercise, sleep, nutrition entries) must only be readable and writable by me — not by anyone who inspects the public anon key in the page source.

**Why this priority**: This is the single highest-risk gap found. The app currently has zero effective data access control; anyone with the anon key (visible in the shipped JS bundle) can read, alter, or delete all personal records. This must close before any public deploy.

**Independent Test**: With authentication in place, attempt to query or modify `registro` rows using only the public anon key and no valid session — every attempt must be rejected. Log in as the owner and confirm normal read/write still works.

**Acceptance Scenarios**:

1. **Given** a request carries only the public anon key and no authenticated session, **When** it tries to read or write `registro`, **Then** the request is rejected.
2. **Given** the owner is logged in, **When** they read or write their own `registro` entries, **Then** the operation succeeds and returns only their own data.
3. **Given** existing `registro` rows created before this change, **When** the access-control change is applied, **Then** every existing row is still associated with the owner and remains visible to them (no data loss or orphaned rows).

---

### User Story 2 - Owner logs in before seeing any personal data (Priority: P1)

As the sole user of this app, I log in with my email and password before I can view or use any page that shows or edits my personal data (Registro, Calendario, Nutrición, Estadísticas). There is no public sign-up — only one account, created by the owner ahead of time.

**Why this priority**: Without a login gate enforced on the server, any visitor who reaches the app's URL sees personal health/lifestyle data. This is the second half of closing the P0 exposure, and it's required before the app can safely be reachable from a public Netlify URL.

**Independent Test**: Visit any app page without a session — confirm redirect to a login screen. Log in with valid credentials — confirm access to the requested page. Attempt login with wrong credentials — confirm rejection with no access.

**Acceptance Scenarios**:

1. **Given** no active session, **When** a visitor requests any app page (Registro, Calendario, Nutrición, Estadísticas), **Then** they are redirected to a login screen and see no personal data.
2. **Given** correct email and password, **When** the owner submits the login form, **Then** they are granted access to the app and the session persists across page reloads.
3. **Given** incorrect credentials, **When** login is attempted, **Then** access is denied and no session is created.
4. **Given** an authenticated session, **When** the browser is closed and reopened later within the session's validity window, **Then** the owner remains logged in without re-entering credentials.
5. **Given** repeated failed login attempts from the same origin in a short window, **When** the threshold is exceeded, **Then** further attempts are throttled.

---

### User Story 3 - Safe to deploy: no accidental data loss or unvalidated input (Priority: P2)

As the app's owner, actions that change or delete my data behave predictably: destructive actions ask for confirmation, and no malformed or malicious input from the browser can corrupt my records.

**Why this priority**: Once auth exists, the remaining risk is a logged-in session (owner or, in a leaked-session scenario, an attacker) sending unexpected input, or the owner accidentally deleting data with no way back.

**Independent Test**: Submit a record-editing form with invalid/out-of-range data directly (bypassing the UI) and confirm it is rejected server-side. Trigger a destructive action (e.g., delete) through the UI and confirm a confirmation step is required before it takes effect.

**Acceptance Scenarios**:

1. **Given** a data-modifying action is submitted with invalid or malformed input, **When** it reaches the server, **Then** it is rejected with a clear error and no data is changed.
2. **Given** the owner triggers a destructive action (e.g., deleting a record), **When** the action is initiated, **Then** a confirmation step is presented before the deletion is executed.

---

### User Story 4 - Deploy previews and search engines don't leak or index the wrong thing (Priority: P2)

As the app's owner, when Netlify builds preview deploys for branches/PRs, those preview URLs must not be indexed by search engines, and when the production link is shared, it shows a proper preview (title, description, image) instead of a broken or generic one.

**Why this priority**: Public preview URLs with no `noindex` can leak an unfinished or personal-data app to search engines. Link previews are a lower-severity polish item bundled into the same pre-deploy pass.

**Independent Test**: Load a simulated preview-deploy URL and confirm the page instructs search engines not to index it. Share the production URL in a chat/social tool and confirm a preview card renders with the expected title, description, and image.

**Acceptance Scenarios**:

1. **Given** the app is served from a Netlify deploy-preview URL (not the production domain), **When** a page is requested, **Then** it responds with a directive telling search engines not to index it.
2. **Given** the app is served from the production domain, **When** a page is requested, **Then** it is indexable and each page declares its own canonical URL and exactly one top-level heading.
3. **Given** a link to the production app is pasted into a chat or social app, **When** the link preview is generated, **Then** it shows a title, description, and image specific to the app.

---

### User Story 5 - Clean, accessible pages with no regressions (Priority: P3)

As the app's owner, every page loads without console errors or warnings, every image has descriptive alt text, and the interactions already built in the previous redesign (hover states, loading animations, mobile menu) still work correctly.

**Why this priority**: Quality/accessibility bar for a page going live publicly; lower risk than the security items but still part of the pre-deploy checklist.

**Independent Test**: Open each page with browser dev tools open and confirm an empty console. Run an accessibility check confirming all images have alt text. Manually exercise hover states, loading states, and the mobile menu on each page.

**Acceptance Scenarios**:

1. **Given** any app page is loaded, **When** the browser console is inspected, **Then** it shows no errors or warnings.
2. **Given** any image is rendered on any page, **When** inspected, **Then** it has descriptive alt text (or is marked decorative where appropriate).
3. **Given** the mobile menu, hover states, and loading animations built in the previous redesign, **When** exercised on each page after this feature's changes, **Then** they behave the same as before (no regression).

---

### User Story 6 - Infrastructure is hardened for public exposure (Priority: P4)

As the app's owner, the deployed app enforces HTTPS everywhere, the login page resists automated bot traffic, and no server query is assembled from raw, unparameterized user input.

**Why this priority**: Defense-in-depth items on top of the P1 access-control fix; valuable but lowest urgency since they mitigate secondary attack paths, not the primary data-exposure gap.

**Independent Test**: Request the app over plain HTTP and confirm redirect to HTTPS. Attempt automated/scripted submissions to the login form and confirm bot-challenge behavior blocks them. Review server-side data-access code for any raw/string-built queries.

**Acceptance Scenarios**:

1. **Given** a request to the app over `http://`, **When** it is received, **Then** it is redirected to `https://`.
2. **Given** an automated script submits the login form repeatedly without human interaction, **When** it does so, **Then** a bot challenge blocks the submission.
3. **Given** the codebase's server-side data-access code, **When** reviewed, **Then** no query is built by concatenating raw user input into SQL.

---

### Edge Cases

- What happens if the owner's login session expires while they are mid-edit on a form? → Their in-progress input should not silently vanish; they should be prompted to re-authenticate and be able to retry the save.
- What happens to the two legacy tracked files (`plan_vida_2026.html`, `Deploy_V1/plan_vida_2026 copy.html`) that reference the old client-side flow once auth/RLS changes land? → They must not continue to grant broader access than the new Next.js app; being untracked/removed from the deploy is treated as the resolution unless the owner says otherwise.
- What happens if someone reaches a Netlify deploy-preview URL directly (not through search)? → It must still require login (User Story 2) even though it's also marked `noindex` (User Story 4) — the two protections are independent layers.
- What happens if optional hardening items (2FA, JSON-LD, `llms.txt`) are skipped for this pass? → They are explicitly out of scope for MVP completion and tracked as optional follow-ups, not blockers.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST require a valid authenticated session before serving any personal data or the Registro, Calendario, Nutrición, or Estadísticas pages, enforced on the server (not only in client-side UI).
- **FR-002**: System MUST authenticate the owner via email and password with no public self-registration path; exactly one account exists, created out-of-band by the owner. The login screen MUST NOT expose a "sign up" link, a "forgot password" / self-service reset flow, or any other account-creation or account-recovery affordance — password changes for the single account are performed by the owner directly in the Supabase dashboard, never through the app's UI.
- **FR-003**: System MUST reject any read or write to `registro` data that is not scoped to the authenticated owner's own records, even when a valid anon key is presented without a session.
- **FR-004**: System MUST associate every `registro` row with the owner's identity, including rows that existed before this change (no data loss).
- **FR-005**: System MUST persist the authenticated session using a mechanism not accessible to client-side JavaScript, to reduce exposure if a cross-site-scripting bug is ever introduced.
- **FR-006**: System MUST validate all input to data-modifying server actions before applying any change, rejecting malformed or out-of-range input with a clear error.
- **FR-007**: System MUST NOT expose any credential or key with elevated (non-public) database privileges to the browser/client bundle.
- **FR-008**: System MUST throttle repeated failed login attempts from the same origin within a short time window.
- **FR-009**: System MUST present a confirmation step before executing any destructive action (e.g., deleting a record).
- **FR-010**: System MUST mark non-production (Netlify deploy-preview) URLs as non-indexable to search engines, while production URLs remain indexable.
- **FR-011**: Each page MUST declare its own canonical URL and exactly one top-level heading.
- **FR-012**: System MUST provide a link-preview image and description so shared production links render a proper preview card.
- **FR-013**: Every image on every page MUST have descriptive alt text or be explicitly marked decorative.
- **FR-014**: Every page MUST load with zero console errors or warnings.
- **FR-015**: System MUST enforce HTTPS for all traffic.
- **FR-016**: System MUST challenge automated/bot submissions to the login form.
- **FR-017**: System MUST NOT build any database query by concatenating raw, unparameterized user input.
- **FR-018**: The two legacy tracked files containing the old client-side app and hardcoded anon key (`plan_vida_2026.html`, `Deploy_V1/plan_vida_2026 copy.html`) MUST no longer be part of the deployed/tracked working tree once this feature is complete, unless the owner explicitly decides to keep them.
- **FR-019**: Previously verified UI behaviors (hover states, loading animations, mobile menu) MUST continue to function correctly after this feature's changes.

_Deferred to a follow-up (optional, not required for this feature to be considered done)_: two-factor/TOTP login, `llms.txt`, JSON-LD structured data.

### Key Entities

- **Owner account**: The single authenticated identity allowed to use the app; has an email, a password (managed by the auth provider), and an identifier that all personal data rows are scoped to.
- **Registro entry**: An existing personal data record (`categoria`, `fecha`, `valor`, `nota`, timestamps) that, after this feature, is also scoped to exactly one owner identity.
- **Session**: The proof that a request comes from the authenticated owner; created at login, checked on every request to a protected page or data operation, and expires after a period of inactivity.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Zero personal `registro` records are readable or writable using only the public anon key without an authenticated session (verified by direct testing against the database).
- **SC-002**: 100% of app pages (Registro, Calendario, Nutrición, Estadísticas) redirect unauthenticated visitors to login before any personal data is rendered.
- **SC-003**: All pre-existing `registro` rows remain correctly associated with the owner after the change, with zero rows lost or orphaned.
- **SC-004**: Netlify deploy-preview URLs are confirmed non-indexable in 100% of pages checked; the production URL renders a correct link-preview card when shared.
- **SC-005**: Every page loads with zero console errors/warnings and 100% of images carry alt text (or are marked decorative) on a full manual pass of all four app pages.
- **SC-006**: A destructive action cannot be completed without an explicit confirmation step, verified on every destructive action in the app.
- **SC-007**: All traffic over plain HTTP is redirected to HTTPS, verified by direct request.

## Assumptions

- The owner will create the single Supabase Auth user manually via the dashboard before or during implementation; this feature does not build a self-registration flow.
- "Owner" and "single user" are the same identity for the lifetime of this app; multi-tenant/multi-user support is out of scope.
- Netlify's default HTTPS enforcement is available and only needs to be confirmed, not built from scratch.
- Free/low-cost bot-protection (e.g., Cloudflare Turnstile) is an acceptable choice for FR-016; the specific vendor is a planning-phase decision, not a spec-level constraint.
- Two-factor authentication, `llms.txt`, and JSON-LD structured data are valuable but optional for this pass, given the app has a single user; they are explicitly deferred.
- Per the project constitution, no Supabase schema change (adding `user_id`, altering RLS policies) is applied without this explicit, already-given approval scoped to exactly the changes described in this spec (User Story 1) — no further undocumented schema changes are in scope.
