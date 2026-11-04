# Phase 1 Data Model: Multi-User Onboarding & Personalized Plan Generation

Alcance: tablas introducidas por el núcleo (US1/US2/US3). `comida_usuario`/
`ejercicio_usuario`/`foto_progreso` (Fases B/C/D) están documentadas en el plan de
implementación pero no creadas todavía — se agregan a este archivo cuando se
implementen.

## `perfil` (nueva tabla)

Una fila por usuario — reemplaza `PERSONAL_DATA`/`INBODY_REFERENCE` hardcodeados de
`lib/calorie-target.ts` y `PLAN_GOAL` de `lib/training-plan.ts`.

| Columna                | Tipo        | Notas                                                                       |
| ---------------------- | ----------- | --------------------------------------------------------------------------- |
| `user_id`              | uuid, PK    | `references auth.users(id) on delete cascade`                               |
| `edad`                 | integer     | requerido                                                                   |
| `altura_cm`            | numeric     | requerido                                                                   |
| `sexo`                 | text        | `check in ('M','F')` — determina el término de Mifflin-St Jeor              |
| `peso_inicial_kg`      | numeric     | requerido; el peso "actual" sigue viniendo de `registro` (categoría `peso`) |
| `factor_actividad`     | numeric     | default `1.55`, solo se usa si no hay calorías activas cargadas ese día     |
| `meta_peso_kg`         | numeric     | opcional — reemplaza `PLAN_GOAL.weightKg`                                   |
| `meta_grasa_pct`       | text        | opcional — reemplaza `PLAN_GOAL.bodyFatPct`                                 |
| `calibracion_peso_kg`  | numeric     | opcional — peso en una medición real (ej. InBody)                           |
| `calibracion_bmr_kcal` | numeric     | opcional — BMR medido en esa misma medición                                 |
| `plan_start`           | date        | fecha de arranque del plan — ver research.md Decisión 1                     |
| `created_at`           | timestamptz | default `now()`                                                             |

RLS: 4 policies owner-scoped (`(select auth.uid()) = user_id`), mismo patrón que
`registro` (spec 003).

## `evento` (nueva tabla)

N filas por usuario — reemplaza `EV_10K`/`EV_LUJAN`/`EV_21K` hardcodeados.

| Columna        | Tipo        | Notas                                                                       |
| -------------- | ----------- | --------------------------------------------------------------------------- |
| `id`           | uuid, PK    | `default gen_random_uuid()`                                                 |
| `user_id`      | uuid        | `not null default auth.uid() references auth.users(id) on delete cascade`   |
| `tipo`         | text        | `check in ('carrera','caminata')`                                           |
| `nombre`       | text        | requerido                                                                   |
| `fecha`        | date        | requerido                                                                   |
| `distancia_km` | numeric     | requerido — determina qué contenido de fase se usa (research.md Decisión 1) |
| `etiqueta`     | text        | opcional — override del label del día de evento (research.md Decisión 2)    |
| `detalle`      | text        | opcional — override del detalle del día de evento                           |
| `created_at`   | timestamptz | default `now()`                                                             |

Índice: `(user_id, fecha)`. RLS: mismo patrón de 4 policies.

## Tipos TypeScript correspondientes

- `UserEvent` (`lib/training-plan.ts`): `{ id, tipo, nombre, fecha, distanciaKm,
etiqueta?, detalle? }` — espejo en camelCase de `evento`.
- `UserProfile` (`lib/calorie-target.ts`): subconjunto de `perfil` que necesita el
  cálculo de BMR (`edad, alturaCm, sexo, factorActividad, calibracionPesoKg?,
calibracionBmrKcal?`).
- `Perfil` (`lib/user-plan.ts`): `UserProfile` + el resto de columnas de `perfil`
  (`pesoInicialKg, metaPesoKg, metaGrasaPct, planStart`).
- `Week` (`lib/training-plan.ts`): unifica el antiguo `Week` interno (con `Date`) y el
  público `PlanWeek` (con `start: string`) en un solo tipo — todo lo que cruza el
  límite Server/Client Component usa `start` como ISO string (ver `lib/date.ts`).

## Relación con `registro` (sin cambios)

`registro` sigue siendo la única tabla de datos día a día (peso, calorías, sueño,
tiradas, caminatas, completados, eventos registrados). No se le agregó ninguna
columna ni se tocó su RLS — sigue aislada por `user_id` exactamente como la dejó spec 003. `perfil`/`evento` son metadata de configuración del plan, no historial.
