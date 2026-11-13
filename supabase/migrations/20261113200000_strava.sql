-- Spec 010: conexión con Strava para importar corridas y caminatas a `registro`.
-- Una fila por usuario; se borra con la cuenta (cascade). Los tokens solo los usa el servidor,
-- pero RLS igual limita cada fila a su dueño.
create table public.strava_conexion (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  athlete_id       bigint not null,
  access_token     text not null,
  refresh_token    text not null,
  expires_at       timestamptz not null,
  -- inicio de la última actividad importada: la próxima importación pide las posteriores
  ultima_actividad timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.strava_conexion enable row level security;

create policy "Individuals can view their own strava_conexion row"
  on public.strava_conexion for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Individuals can insert their own strava_conexion row"
  on public.strava_conexion for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Individuals can update their own strava_conexion row"
  on public.strava_conexion for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Individuals can delete their own strava_conexion row"
  on public.strava_conexion for delete to authenticated
  using ((select auth.uid()) = user_id);
