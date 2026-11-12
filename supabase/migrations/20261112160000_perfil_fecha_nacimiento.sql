-- Registro en pasos (specs/005-coach-ia): fecha de nacimiento en vez de edad fija, así la
-- edad del cálculo de calorías se mantiene al día sola. `edad` queda (not null, spec 004)
-- para las cuentas previas; lib/user-plan.ts prefiere fecha_nacimiento cuando existe.
-- El nombre y la aceptación de términos viven en auth.users.raw_user_meta_data.
alter table public.perfil add column fecha_nacimiento date;
