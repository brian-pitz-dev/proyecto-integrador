-- Contract: migración manual de la cuenta de Brian (dueño actual, único
-- usuario con datos reales hoy) al modelo multi-usuario. NO se ejecuta
-- automáticamente — correr a mano en el SQL editor de Supabase, DESPUÉS de
-- aplicar 20261104140911_perfil_evento.sql, reemplazando <OWNER_UUID> por el
-- id real de su cuenta en auth.users (mismo patrón que
-- specs/003-security-hardening/contracts/rls-migration.sql).
--
-- Objetivo: que buildPlan(planStart, eventos, hoy) reproduzca exactamente el
-- plan hardcodeado de hoy para el rango 17/ago–31/dic 2026 (FR-012/FR-013).
-- No toca registro (su historial de peso/sueño/calorías/tiradas/completados
-- queda intacto).

insert into public.perfil (
  user_id, edad, altura_cm, sexo, peso_inicial_kg, factor_actividad,
  meta_peso_kg, meta_grasa_pct, calibracion_peso_kg, calibracion_bmr_kcal, plan_start
) values (
  '<OWNER_UUID>', 28, 180, 'M', 94.9, 1.55,
  80, '14-15%', 94.9, 1859, '2026-08-17'
);

insert into public.evento (user_id, tipo, nombre, fecha, distancia_km, etiqueta, detalle) values
  ('<OWNER_UUID>', 'carrera', '10K', '2026-09-13', 10,
   'CARRERA 10K',
   'Objetivo: menos de 1:00:00 · Salí controlado los primeros 2km, después soltá.'),
  ('<OWNER_UUID>', 'caminata', 'Procesión a Luján', '2026-10-03', 80,
   'PROCESIÓN A LUJÁN — 80KM',
   'De un tirón · Ritmo muy conservador · Hidratación constante.'),
  ('<OWNER_UUID>', 'carrera', '21K Mar del Plata', '2026-11-08', 21.1,
   'MEDIA MARATÓN 21K — Mar del Plata',
   'Objetivo 2h20 (6:38/km) · km 1-3 a 6:45, km 4-16 a 6:35, km 17-21 a 6:30 si vas entero · gel a los 45'' y 90''.');

-- Después, UNA SOLA VEZ, marcar su cuenta como onboarded para que nunca vea
-- el formulario de onboarding — auth.users.raw_user_meta_data es lo que
-- Supabase expone como user.user_metadata en la sesión; el `||` mergea en vez
-- de pisar cualquier otra clave que ya tenga:
update auth.users
  set raw_user_meta_data = raw_user_meta_data || '{"onboarding_completed": true}'::jsonb
  where id = '<OWNER_UUID>';
