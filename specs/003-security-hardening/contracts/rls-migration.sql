-- Contract: schema change required by User Story 1 / data-model.md.
-- NOT executed by /speckit-plan — this is the reviewable artifact for the
-- explicit approval already given in the originating request (Constitution
-- Principle IV). /speckit-implement runs this against Supabase only after
-- the owner has created their single auth.users account and confirmed its id.

-- 1. Add the column, nullable first so existing rows aren't rejected mid-backfill.
alter table public.registro
  add column user_id uuid references auth.users;

-- 2. Backfill: replace <OWNER_UUID> with the id of the single Supabase Auth
--    user (from auth.users), created manually via the dashboard.
update public.registro
  set user_id = '<OWNER_UUID>'
  where user_id is null;

-- 3. Now that every row has an owner, enforce it going forward.
-- NOTE: `default (select auth.uid())` fails with
-- "ERROR: 0A000: cannot use subquery in DEFAULT expression" — a column
-- DEFAULT can only call a function directly, not wrap it in a subquery
-- (that wrapping is only valid/useful inside RLS USING/WITH CHECK clauses).
alter table public.registro
  alter column user_id set not null;
alter table public.registro
  alter column user_id set default auth.uid();

-- 4. Replace the "allow all" policy with owner-scoped policies.
drop policy if exists "Permitir todo con anon key" on public.registro;

create policy "Individuals can view their own registro rows"
  on public.registro for select
  using ((select auth.uid()) = user_id);

create policy "Individuals can insert their own registro rows"
  on public.registro for insert
  with check ((select auth.uid()) = user_id);

create policy "Individuals can update their own registro rows"
  on public.registro for update
  using ((select auth.uid()) = user_id);

create policy "Individuals can delete their own registro rows"
  on public.registro for delete
  using ((select auth.uid()) = user_id);
