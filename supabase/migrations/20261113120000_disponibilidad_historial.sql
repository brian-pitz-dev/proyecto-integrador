-- Historial de disponibilidad (días y minutos de entrenamiento): cuando el usuario los cambia en
-- /perfil, app/(app)/perfil/actions.ts agrega acá la disponibilidad anterior con `hasta` = el lunes
-- de la semana del cambio. lib/training-plan.ts (buildPlan) arma las semanas que empezaron antes
-- de `hasta` con esa disponibilidad, así el calendario pasado no se reacomoda.
-- Formato: [{ "hasta": "YYYY-MM-DD", "dias": [0..6], "minutos": 60 }, ...] (se valida al leer).
alter table public.perfil
  add column disponibilidad_historial jsonb not null default '[]'::jsonb
    check (jsonb_typeof(disponibilidad_historial) = 'array');
