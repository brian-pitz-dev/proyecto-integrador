-- Esquema inicial: tabla registro (basada en Plan de Vida 2026)
create table public.registro (
  id          uuid primary key default gen_random_uuid(),
  categoria   text not null,
  fecha       date not null,
  valor       numeric,
  nota        text,
  created_at  timestamptz default now(),
  user_id     uuid not null default auth.uid()
              references auth.users(id) on delete cascade
);

-- índice para las consultas por usuario/categoría ordenadas por fecha
create index registro_user_categoria_fecha_idx
  on public.registro (user_id, categoria, fecha desc);

-- RLS: cada usuario solo ve y modifica sus propias filas
alter table public.registro enable row level security;

create policy "Individuals can view their own registro rows"
  on public.registro for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Individuals can insert their own registro rows"
  on public.registro for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Individuals can update their own registro rows"
  on public.registro for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Individuals can delete their own registro rows"
  on public.registro for delete to authenticated
  using ((select auth.uid()) = user_id);