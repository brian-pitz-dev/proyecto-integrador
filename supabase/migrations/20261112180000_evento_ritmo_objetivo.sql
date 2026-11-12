-- Ritmo objetivo opcional por evento (segundos por km). Reemplaza los ritmos fijos de Brian
-- (6:38/km carrera, 6:00/km series) que lib/training-plan.ts usaba para TODOS los usuarios en
-- las semanas previas a una carrera larga. null = el plan dice "ritmo de carrera" sin número.
alter table public.evento
  add column ritmo_objetivo_seg integer
  check (ritmo_objetivo_seg between 150 and 900);

-- Cuenta de Brian (spec 004, brian-migration.sql): conserva su ritmo para que su plan histórico
-- siga mostrando exactamente los mismos textos. Solo matchea ese evento puntual.
update public.evento
  set ritmo_objetivo_seg = 398 -- 6:38/km
  where nombre = '21K Mar del Plata'
    and fecha = '2026-11-08'
    and distancia_km = 21.1;
