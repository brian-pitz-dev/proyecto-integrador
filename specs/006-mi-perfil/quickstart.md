# Quickstart: validar Mi perfil

0. Aplicar `supabase/migrations/20261112200000_perfil_disponibilidad.sql` (`supabase db push`).
1. `npm test` → pasa `lib/training-plan.test.ts` (antes `scripts/check-training-days.mjs`).
2. Con una cuenta existente, el Calendario se ve igual que antes de la migración.
3. Header → ícono de usuario → `/perfil`. Elegir Mar, Jue y Sáb y guardar la semana. En el
   Calendario solo hay sesiones esos días, y la salida larga cae el sábado.
4. Elegir 30 minutos: cada día tiene una sola sesión y las rutinas de gym muestran 3
   ejercicios.
5. Agregar un evento futuro: aparece en "Tus eventos" del Calendario y su bloque de fases
   en el plan. Editarlo y borrarlo.
6. Crear una cuenta nueva: el paso Perfil pide los días y el tiempo, y el plan arranca con
   esa semana.
