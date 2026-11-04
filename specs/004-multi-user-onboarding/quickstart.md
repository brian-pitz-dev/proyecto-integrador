# Quickstart: Multi-User Onboarding (núcleo)

Validación manual — no hay test suite automatizado en este repo (ver CLAUDE.md).

## 1. Setup

1. Aplicar `supabase/migrations/20261104140911_perfil_evento.sql` contra el proyecto
   de Supabase (dashboard → SQL editor, o `supabase db push` si usás el CLI).
2. **No** correr todavía `specs/004-multi-user-onboarding/contracts/brian-migration.sql`
   — primero probar el flujo de usuario nuevo (§2), para no mezclar la cuenta de
   prueba con la cuenta real de Brian.

## 2. Usuario nuevo

1. `/signup` con un email de prueba → debería redirigir a `/onboarding` (no a
   `/calendario`).
2. Intentar visitar `/calendario` directamente antes de completar el onboarding →
   debe redirigir de vuelta a `/onboarding`.
3. Enviar el formulario de onboarding sin cargar ningún evento → debe rechazarse
   con un mensaje claro (FR-004).
4. Completar el formulario con un perfil válido y **un evento `carrera` a ~10
   semanas de hoy, distancia 10km** → debe redirigir a `/calendario`.
5. En Calendario: confirmar que las semanas antes del evento muestran contenido de
   `phase1Week` (sin construcción tipo 21K) y que la semana del evento muestra el
   override genérico (`CARRERA — {nombre}`).
6. En Nutrición: confirmar que aparecen las 5 comidas del día con el total de
   proteína.
7. En Estadísticas: cargar un peso y confirmar que aparece una meta calórica.
8. Crear una **segunda cuenta** con perfil/evento distintos (ej. `caminata`,
   fecha distinta) → confirmar que su calorie target y sus sesiones son
   distintas a las de la primera cuenta, y que ninguna de las dos ve datos de la
   otra (probar también que un intento de leer/escribir con el `user_id`
   incorrecto es rechazado por RLS, mismo estilo que
   `specs/003-security-hardening/quickstart.md`).

## 3. Migración de Brian (regresión — FR-012/FR-013)

1. Antes de correr `brian-migration.sql`: con la versión actual de la app (antes de
   este cambio, o comparando contra capturas previas), anotar el resultado de
   Calendario/Nutrición/Estadísticas para estas fechas: 2026-08-20, 2026-09-13,
   2026-09-20, 2026-10-03, 2026-10-10, 2026-11-08, 2026-11-15, 2026-12-31.
2. Correr `brian-migration.sql` con el UUID real de su cuenta, y marcar
   `user_metadata.onboarding_completed = true` (ver instrucciones dentro del
   archivo).
3. Loguearse como Brian → debe entrar directo a `/calendario`, **sin** pasar por
   `/onboarding`.
4. Re-chequear las mismas fechas del paso 1 → el resultado debe ser idéntico:
   misma sesión de gym, mismas comidas/proteína total, mismo target calórico.
5. Confirmar en particular los textos de evento-día del 2026-09-13 (10K) y
   2026-11-08 (21K) — deben coincidir exactamente con el texto original (vienen
   de `evento.detalle`, no de la plantilla genérica).
6. Confirmar que su historial de `registro` (peso/sueño/calorías/tiradas/
   completados) sigue intacto y visible solo para él.

## 4. Build/lint

```bash
npm run build
npm run lint
```

Ambos deben terminar sin errores.
