# Contract: Auth Server Actions

Internal contract between the login UI and the server actions it calls (`"use server"` functions, App Router convention — no public HTTP API is exposed by this app).

## `login(input)`

**Input**:
```ts
{
  email: string;
  password: string;
  turnstileToken: string; // Cloudflare Turnstile response token from the client widget
}
```

**Behavior**:
1. Validate `input` shape with `zod` (reject malformed input before any network call).
2. Verify `turnstileToken` server-side via `fetch` to Cloudflare's siteverify endpoint. Reject on failure.
3. Check the in-memory rate-limit counter for the requesting IP; reject with a throttling error if the window's failure threshold is exceeded.
4. Call Supabase Auth `signInWithPassword({ email, password })` via the server Supabase client (cookie-backed).
5. On success, the `@supabase/ssr` server client sets the session cookies on the response; the action returns `{ ok: true }`.
6. On failure (bad credentials, rate limit, bot check), increment the rate-limit counter (for credential failures) and return `{ ok: false, message }` — never leak whether the email exists.

**Output**:
```ts
{ ok: boolean; message?: string }
```

## `logout()`

**Input**: none.

**Behavior**: Calls Supabase Auth `signOut()` via the server client, clearing the session cookies.

**Output**: `{ ok: boolean }`

## Contract shared by all existing data-modifying actions (`saveLog`, `deleteLog`, `toggleDayDone`, etc.)

Every action in `app/*/actions.ts` MUST, before touching Supabase:

1. Resolve the current user via a shared `getAuthedUser()` helper reading the server Supabase client's session (research.md Decision 5). If no user, return `{ ok: false, message: "No autenticado" }` without querying the database.
2. Validate all input fields with a `zod` schema specific to that action (research.md Decision 4 / data-model.md validation rules) before calling Supabase.
3. Scope every Supabase query to the resolved `user_id` (defense in depth on top of RLS — e.g. `.eq("user_id", user.id)` in addition to the RLS policy doing the same at the database level).

This contract does not change the existing `ActionResult` return shape (`{ ok: boolean; message?: string }`) already used by `app/registro/actions.ts`.
