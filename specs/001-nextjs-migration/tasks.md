# Tasks: Migración a Next.js con Diseño Renovado

**Input**: Design documents from `/specs/001-nextjs-migration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md, quickstart.md

**Tests**: No se pidieron tests automatizados en la spec (proyecto personal); la
validación de esta etapa es el recorrido manual de `quickstart.md`, incluido como
tarea de Polish.

**Organization**: Tareas agrupadas por user story de `spec.md` (US1 = P1, US2 = P2,
US3 = P3), para poder implementar y validar cada una de forma independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: A qué user story pertenece (US1, US2, US3)

## Path Conventions

Proyecto único Next.js App Router (ver `plan.md` § Project Structure): `app/`,
`components/`, `lib/` en la raíz del repo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar el proyecto Next.js y las dependencias base.

- [X] T001 Inicializar proyecto Next.js (App Router, TypeScript estricto, Tailwind CSS) en la raíz del repo, junto al `plan_vida_2026.html` existente
- [X] T002 Inicializar shadcn/ui (`npx shadcn@latest init`) según `research.md` §5
- [X] T003 [P] Agregar componentes base de shadcn/ui necesarios (button, card, dialog, form, input, calendar, badge, toast) a `components/ui/`
- [X] T004 [P] Configurar variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local` (mismos valores que usa `plan_vida_2026.html`, ver `research.md` §3)
- [X] T005 [P] Configurar ESLint/Prettier con reglas TypeScript estrictas (Principio I de la constitución) en `.eslintrc.json` / `.prettierrc`

**Checkpoint**: Proyecto Next.js corre localmente con Tailwind y shadcn/ui listos.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura compartida que todas las user stories necesitan.

**⚠️ CRITICAL**: Ninguna user story empieza hasta terminar esta fase.

- [X] T006 [P] Crear cliente Supabase de navegador en `lib/supabase/client.ts` con `createBrowserClient` (`research.md` §3)
- [X] T007 [P] Crear cliente Supabase de servidor en `lib/supabase/server.ts` con `createServerClient`, sin manejo de cookies de sesión (`research.md` §3 y §6)
- [X] T008 [P] Definir el tipo `Registro` y el union de `categoria` (`tirada` | `caminata` | `calorias` | `peso` | `sueno` | `completado`) en `lib/types.ts`, según `data-model.md`
- [X] T009 Crear layout raíz `app/layout.tsx` (Server Component) con navegación entre Registro / Calendario / Estadísticas
- [X] T010 Definir el plan de entrenamiento semanal (días + `tag`, ej. `"gym"`) como constante tipada en `lib/training-plan.ts`, igual al que usa hoy `plan_vida_2026.html`
- [X] T011 [P] Crear `app/page.tsx` (Server Component) con redirect a `/registro`

**Checkpoint**: Clientes de Supabase, tipos y layout listos — las user stories pueden empezar.

---

## Phase 3: User Story 1 - Registrar actividad y salud diaria sin perder datos históricos (Priority: P1) 🎯 MVP

**Goal**: Poder cargar tiradas, caminatas, calorías, peso y sueño, ver los registros
históricos existentes en Supabase, y borrar registros — igual que hoy.

**Independent Test**: Cargar un registro de cada tipo y confirmar que aparece
correctamente calculado (pace, objetivo calórico) y que los registros ya existentes
en Supabase se siguen viendo sin pérdida (Acceptance Scenarios 1-4 de US1 en spec.md).

### Implementation for User Story 1

- [X] T012 [P] [US1] Implementar helpers de tiempo/pace (`parseTimeToSeconds`, `formatPace`) en `lib/pace.ts`, portados de `plan_vida_2026.html`
- [X] T013 [P] [US1] Implementar `mifflin()` y `getCalorieTarget()` en `lib/calorie-target.ts`, portados de `plan_vida_2026.html` (usa el último `registro` con `categoria: "peso"`)
- [X] T014 [US1] Implementar Server Action `saveLog` en `app/registro/actions.ts` según el contrato en `contracts/server-actions.md` (insert en `registro`, `revalidatePath` de calendario/estadísticas)
- [X] T015 [US1] Implementar Server Action `deleteLog` en `app/registro/actions.ts` según el contrato en `contracts/server-actions.md`
- [X] T016 [P] [US1] Crear formulario de tirada (`RunForm`) en `components/log-form/run-form.tsx` (Client Component: km, tiempo, calcula pace con `lib/pace.ts`, llama `saveLog` con `categoria: "tirada"`)
- [X] T017 [P] [US1] Crear formulario de caminata (`WalkForm`) en `components/log-form/walk-form.tsx` (Client Component: km, `categoria: "caminata"`)
- [X] T018 [P] [US1] Crear formulario de calorías (`CalorieForm`) en `components/log-form/calorie-form.tsx` (Client Component: `categoria: "calorias"`)
- [X] T019 [P] [US1] Crear formulario de peso (`WeightForm`) en `components/log-form/weight-form.tsx` (Client Component: `categoria: "peso"`)
- [X] T020 [P] [US1] Crear formulario de sueño (`SleepForm`) en `components/log-form/sleep-form.tsx` (Client Component: horas+minutos → decimal, `categoria: "sueno"`)
- [X] T021 [US1] Crear página `app/registro/page.tsx` (Server Component): lee últimos registros por categoría desde `lib/supabase/server.ts`, renderiza los 5 formularios y el listado con acción de borrar (usa `deleteLog`)
- [X] T022 [US1] Mostrar objetivo calórico calculado (`getCalorieTarget`) en `app/registro/page.tsx` junto al formulario de calorías
- [X] T023 [US1] Agregar manejo de error de conexión/guardado (mensaje de UI en vez de `alert()`, usando el componente `toast` de shadcn/ui) en los 5 formularios y en el borrado

**Checkpoint**: User Story 1 funcional de forma independiente — MVP.

---

## Phase 4: User Story 2 - Ver progreso, rachas y alertas de forma clara (Priority: P2)

**Goal**: Calendario de días completados, y las mismas alertas de racha de gym y
ritmo de running que la app actual.

**Independent Test**: Marcar/desmarcar días completados y verificar que el
calendario se actualiza al instante; forzar las condiciones de alerta y verificar
que aparecen (Acceptance Scenarios 1-3 de US2 en spec.md).

### Implementation for User Story 2

- [X] T024 [US2] Implementar Server Action `toggleDayDone` en `app/calendario/actions.ts` según el contrato en `contracts/server-actions.md`
- [X] T025 [P] [US2] Implementar `getSessionsForDate` en `lib/training-plan.ts` (cruza `lib/training-plan.ts` con la fecha pedida)
- [X] T026 [P] [US2] Implementar `checkGymStreak` en `lib/streaks.ts` (3+ sesiones "gym" seguidas sin `categoria: "completado"`, portado de `plan_vida_2026.html`)
- [X] T027 [P] [US2] Implementar `checkRunAlert` en `lib/streaks.ts` (ritmo de las últimas 2 tiradas de sábado vs. objetivo, portado de `plan_vida_2026.html`)
- [X] T028 [US2] Crear `components/calendar-grid/calendar-grid.tsx` (Client Component): grilla semanal, pinta días completados, bloquea marcar días futuros (edge case de spec.md), llama `toggleDayDone`
- [X] T029 [US2] Crear página `app/calendario/page.tsx` (Server Component): lee `categoria: "completado"` desde Supabase (equivalente a `getCompletedDates()`) y renderiza `CalendarGrid`
- [X] T030 [P] [US2] Crear `components/stats/gym-streak-alert.tsx` (usa `checkGymStreak`)
- [X] T031 [P] [US2] Crear `components/stats/run-pace-alert.tsx` (usa `checkRunAlert`)
- [X] T032 [US2] Crear página `app/estadisticas/page.tsx` (Server Component): renderiza `GymStreakAlert` y `RunPaceAlert` con los datos leídos de Supabase

**Checkpoint**: User Stories 1 y 2 funcionan juntas de forma independiente.

---

## Phase 5: User Story 3 - Usar la app con un diseño visual renovado (Priority: P3)

**Goal**: Misma información y acciones de US1/US2, con una interfaz visual
renovada (shadcn/ui + Tailwind, siguiendo `ui-ux-pro-max`) y responsive.

**Independent Test**: Recorrer registro, calendario y estadísticas en escritorio y
en 360px de ancho, confirmando que todas las acciones siguen disponibles y no hay
scroll horizontal ni elementos cortados (Acceptance Scenarios 1-2 de US3 en spec.md).

### Implementation for User Story 3

- [X] T033 [US3] Definir tokens de tema (color, tipografía, espaciado) en `tailwind.config.ts` siguiendo el skill `ui-ux-pro-max` (Principio III de la constitución)
- [X] T034 [P] [US3] Aplicar componentes `Card`/`Form`/`Input` de shadcn/ui a los 5 formularios de `components/log-form/` (reemplaza inputs sin estilo)
- [X] T035 [P] [US3] Rediseñar `CalendarGrid` (`components/calendar-grid/calendar-grid.tsx`) con el componente `Calendar`/grid de shadcn/ui manteniendo el pintado de días completados
- [X] T036 [P] [US3] Rediseñar las alertas (`components/stats/gym-streak-alert.tsx`, `run-pace-alert.tsx`) con el componente `Badge`/`Alert` de shadcn/ui
- [X] T037 [US3] Rediseñar la navegación de `app/layout.tsx` (nav responsive: tabs en escritorio, barra inferior en celular)
- [X] T038 [US3] Pasada de revisión responsive en las 3 páginas (`app/registro`, `app/calendario`, `app/estadisticas`) desde 360px hasta 1920px, sin scroll horizontal (SC-004)

**Checkpoint**: Las tres user stories funcionan con el diseño renovado.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validación final y limpieza, sin tocar el schema de Supabase.

- [X] T039 Ejecutar `npm run lint` y `tsc --noEmit` sobre todo el proyecto y corregir hallazgos
- [X] T040 Recorrer manualmente los tres escenarios de `quickstart.md` (US1, US2, US3) contra el mismo proyecto de Supabase que usa `plan_vida_2026.html`
- [X] T041 Confirmar que el schema de Supabase (columnas, tipos, políticas de `registro`) sigue idéntico al de `data-model.md` (Principio IV de la constitución) tras completar T001-T038

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias, arranca de inmediato
- **Foundational (Phase 2)**: depende de Setup — bloquea todas las user stories
- **User Stories (Phase 3-5)**: dependen de Foundational; pueden avanzar en paralelo o en orden de prioridad (US1 → US2 → US3)
- **Polish (Phase 6)**: depende de las user stories que se quieran incluir en esta etapa (mínimo US1)

### User Story Dependencies

- **US1 (P1)**: solo depende de Foundational
- **US2 (P2)**: depende de Foundational; usa los mismos formularios/página de registro de US1 solo como referencia de datos, no como bloqueo — es independientemente testeable con datos cargados manualmente en Supabase si hiciera falta
- **US3 (P3)**: depende de que existan los componentes de US1/US2 para poder re-diseñarlos (T034-T036); no bloquea la funcionalidad, solo la estética

### Parallel Opportunities

- T003, T004, T005 en paralelo (Setup)
- T006, T007, T008 en paralelo (Foundational)
- T012, T013 en paralelo; T016-T020 (los 5 formularios) en paralelo entre sí (US1)
- T025, T026, T027 en paralelo (US2)
- T030, T031 en paralelo (US2)
- T034, T035, T036 en paralelo (US3)

---

## Parallel Example: User Story 1

```bash
# Helpers en paralelo:
Task: "Implementar helpers de pace en lib/pace.ts"
Task: "Implementar mifflin()/getCalorieTarget() en lib/calorie-target.ts"

# Los 5 formularios en paralelo (después de T014/T015):
Task: "Crear RunForm en components/log-form/run-form.tsx"
Task: "Crear WalkForm en components/log-form/walk-form.tsx"
Task: "Crear CalorieForm en components/log-form/calorie-form.tsx"
Task: "Crear WeightForm en components/log-form/weight-form.tsx"
Task: "Crear SleepForm en components/log-form/sleep-form.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 solamente)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational
3. Completar Phase 3: User Story 1
4. **Parar y validar**: correr el escenario US1 de `quickstart.md`
5. Ya es un reemplazo funcional mínimo de la parte de registro del HTML actual

### Incremental Delivery

1. Setup + Foundational → base lista
2. + US1 → validar → registro de datos migrado (MVP)
3. + US2 → validar → calendario y alertas migrados
4. + US3 → validar → diseño renovado sobre todo lo anterior
5. Phase 6 (Polish) cierra la etapa, confirmando que el schema no cambió

---

## Notes

- [P] = archivos distintos, sin dependencias entre sí
- [Story] mapea cada tarea a su user story para trazabilidad contra spec.md
- Ninguna tarea de esta lista modifica el schema de Supabase (Principio IV) — todas
  leen/escriben sobre la tabla `registro` tal como está documentada en `data-model.md`
- Antes de cualquier tarea que implemente una API o convención nueva de Next.js o
  Supabase no cubierta ya en `research.md`, consultar context7 (Principio II)
