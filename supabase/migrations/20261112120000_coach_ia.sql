-- Coach IA (specs/005-coach-ia): planes generados por IA + cuota diaria de uso por usuario.

-- Un plan por tipo por usuario. `contenido` tiene la misma forma que las constantes
-- de lib/meal-plan.ts (MealBank) / lib/gym-exercises.ts (Record<gymKey, Routine>);
-- se valida con zod al escribir y al leer (lib/validation/coach.ts).
create table public.plan_ia (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo       text not null check (tipo in ('comidas', 'ejercicios')),
  contenido  jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, tipo)
);

alter table public.plan_ia enable row level security;

create policy "Individuals can view their own plan_ia rows"
  on public.plan_ia for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Individuals can insert their own plan_ia rows"
  on public.plan_ia for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Individuals can update their own plan_ia rows"
  on public.plan_ia for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Individuals can delete their own plan_ia rows"
  on public.plan_ia for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Contador de usos por día (fecha de Buenos Aires). Solo SELECT para el dueño: sin
-- policies de insert/update/delete nadie puede resetear su contador desde el navegador;
-- se incrementa únicamente vía consumir_uso_ia() (security definer).
create table public.uso_ia (
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha   date not null,
  usos    integer not null default 0,
  primary key (user_id, fecha)
);

alter table public.uso_ia enable row level security;

create policy "Individuals can view their own uso_ia rows"
  on public.uso_ia for select to authenticated
  using ((select auth.uid()) = user_id);

-- Consume 1 uso del día; false si ya llegó al límite. El límite (20) va hardcodeado
-- acá a propósito: supabase.rpc() se puede llamar desde el navegador, un parámetro
-- `limite` se podría falsear. Si se cambia, actualizar AI_DAILY_LIMIT en lib/coach.ts.
create function public.consumir_uso_ia()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  if auth.uid() is null then
    return false;
  end if;

  insert into public.uso_ia (user_id, fecha, usos)
  values (auth.uid(), (now() at time zone 'America/Argentina/Buenos_Aires')::date, 1)
  on conflict (user_id, fecha) do update
    set usos = public.uso_ia.usos + 1
    where public.uso_ia.usos < 20
  returning usos into n;

  return n is not null;
end;
$$;

revoke execute on function public.consumir_uso_ia() from public, anon;
grant execute on function public.consumir_uso_ia() to authenticated;
