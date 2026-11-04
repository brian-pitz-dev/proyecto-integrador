-- Perfil y eventos por usuario (specs/004-multi-user-onboarding): reemplaza
-- las constantes hardcodeadas de lib/training-plan.ts / lib/calorie-target.ts
-- por datos propios de cada cuenta. Mismo patrón de RLS que public.registro.

create table public.perfil (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  edad                  integer not null,
  altura_cm             numeric not null,
  sexo                  text not null check (sexo in ('M', 'F')),
  peso_inicial_kg       numeric not null,
  factor_actividad      numeric not null default 1.55,
  meta_peso_kg          numeric,
  meta_grasa_pct        text,
  calibracion_peso_kg   numeric,
  calibracion_bmr_kcal  numeric,
  plan_start            date not null,
  created_at            timestamptz default now()
);

alter table public.perfil enable row level security;

create policy "Individuals can view their own perfil row"
  on public.perfil for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Individuals can insert their own perfil row"
  on public.perfil for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Individuals can update their own perfil row"
  on public.perfil for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Individuals can delete their own perfil row"
  on public.perfil for delete to authenticated
  using ((select auth.uid()) = user_id);

create table public.evento (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tipo          text not null check (tipo in ('carrera', 'caminata')),
  nombre        text not null,
  fecha         date not null,
  distancia_km  numeric not null,
  -- overrides opcionales del texto del día de evento; null = plantilla genérica (ver eventOverrideFor en lib/training-plan.ts)
  etiqueta      text,
  detalle       text,
  created_at    timestamptz default now()
);

create index evento_user_fecha_idx on public.evento (user_id, fecha);

alter table public.evento enable row level security;

create policy "Individuals can view their own evento rows"
  on public.evento for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Individuals can insert their own evento rows"
  on public.evento for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Individuals can update their own evento rows"
  on public.evento for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Individuals can delete their own evento rows"
  on public.evento for delete to authenticated
  using ((select auth.uid()) = user_id);
