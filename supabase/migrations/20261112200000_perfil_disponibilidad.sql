-- Disponibilidad de entrenamiento por usuario (spec 006): qué días de la semana puede entrenar
-- (0 = lunes … 6 = domingo) y cuántos minutos tiene por sesión. lib/training-plan.ts reubica y
-- recorta la plantilla semanal según esto. Los defaults (lunes a sábado, 60 min) reproducen
-- exactamente la plantilla original: las cuentas existentes no ven ningún cambio en su plan.
alter table public.perfil
  add column dias_entrenamiento smallint[] not null default '{0,1,2,3,4,5}'
    check (
      dias_entrenamiento <@ '{0,1,2,3,4,5,6}'::smallint[]
      and cardinality(dias_entrenamiento) between 1 and 7
    ),
  add column minutos_sesion smallint not null default 60
    check (minutos_sesion in (30, 45, 60, 90));

-- Mi perfil permite editar perfil y eventos: el Coach avisa que las rutinas/comidas de la IA
-- quedaron viejas comparando contra updated_at (antes, solo created_at). Las filas existentes
-- arrancan con su created_at para no marcar como desactualizado lo que ya estaba al día.
alter table public.perfil add column updated_at timestamptz;
update public.perfil set updated_at = created_at;
alter table public.perfil alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.evento add column updated_at timestamptz;
update public.evento set updated_at = created_at;
alter table public.evento alter column updated_at set default now(),
  alter column updated_at set not null;
