# Tasks: Multi-User Onboarding & Personalized Plan Generation (núcleo)

**Input**: Design documents from `/specs/004-multi-user-onboarding/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Sin framework de test en el repo (igual que specs 001-003). La pieza de
más riesgo (el motor de fases) se validó con un script `tsx` ad-hoc comparado
numéricamente contra el comportamiento original — ver research.md Decisión 1. El
resto, validación manual vía `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 Migración `supabase/migrations/20261104140911_perfil_evento.sql`: tablas
      `perfil`/`evento` + RLS owner-scoped (data-model.md) — aplicada manualmente en
      el SQL editor de Supabase
- [x] T002 [P] `lib/validation/onboarding.ts`: `signupSchema`, `eventoSchema`,
      `onboardingSchema` (zod, mismo estilo que `lib/validation/registro.ts`)
- [x] T003 [P] `lib/turnstile.ts`: agregar parámetro `action` a
      `verifyTurnstileToken` (antes hardcodeaba `"login"`); `lib/rate-limit.ts`:
      bucket `signupAttempts` nuevo

**Checkpoint**: Setup listo.

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 `lib/training-plan.ts`: reescribir `buildPlan(planStart, events, today)`
      reemplazando la IIFE de `weeks` a nivel de módulo y los 3 eventos hardcodeados
      — ver research.md Decisión 1 para el algoritmo completo
- [x] T005 `lib/calorie-target.ts`: `UserProfile` reemplaza `PERSONAL_DATA`/
      `INBODY_REFERENCE`; corregido el bug de fórmula sin término de sexo (research.md
      Decisión 4)
- [x] T006 [P] Efecto dominó en consumidores puros: `lib/meal-plan.ts` (research.md
      Decisión 5), `lib/stats-summary.ts`, `lib/streaks.ts` — todos reciben
      `weeks`/`events`/`profile` en vez de leer constantes globales
- [x] T007 `lib/user-plan.ts`: `getUserPlanContext()`, punto único de carga de
      perfil+eventos+`buildPlan` para los Server Components

**Checkpoint**: Motor de plan generalizado. Nada todavía lo consume desde la UI.

---

## Phase 3: User Story 1 - Cualquiera puede registrarse y completar onboarding (Priority: P1) 🎯 MVP

- [x] T008 [US1] `app/signup/actions.ts` + `app/signup/page.tsx` +
      `components/signup-form.tsx` — espejo de `app/login/` con
      `action: "signup"` en Turnstile
- [x] T009 [US1] `app/onboarding/actions.ts` (`completeOnboarding`): `getAuthedUser()`
      → upsert `perfil` → insert `evento[]` → `supabase.auth.updateUser({ data: {
    onboarding_completed: true } })` (research.md Decisión 3) — rechaza
      onboarding sin eventos (FR-004, vía `onboardingSchema.eventos.min(1)`)
- [x] T010 [US1] `components/onboarding-form.tsx` + `app/onboarding/page.tsx`:
      formulario de perfil + lista dinámica de eventos (agregar/quitar filas)
- [x] T011 [US1] `proxy.ts`: gate de onboarding (`user.user_metadata.
    onboarding_completed`), redirige a `/onboarding` si falta, a `/calendario` si
      ya está completo y visita `/onboarding`; `/signup` sumado a rutas públicas
- [x] T012 [US1] Validación manual (`quickstart.md` §2): signup → onboarding →
      rechazo sin eventos → onboarding válido → llega a `/calendario`

**Checkpoint**: Cualquiera puede registrarse y completar onboarding. Probado con una
cuenta de prueba real.

---

## Phase 4: User Story 2 - El plan se genera desde los datos propios del usuario (Priority: P1)

- [x] T013 [US2] `app/(app)/calendario/page.tsx`, `estadisticas/page.tsx`,
      `nutricion/page.tsx` + `actions.ts`: migrados a `getUserPlanContext()` en vez
      de las constantes globales de `training-plan.ts`/`calorie-target.ts`
- [x] T014 [US2] [P] `components/calendar-grid/calendar-grid.tsx`,
      `components/log-form/event-form.tsx`, `components/nutrition/nutricion-client.tsx`,
      `components/week-selector/week-selector.tsx`: reciben `weeks`/`events` como
      props en vez de importar funciones globales
- [x] T015 [US2] Validación manual: dos cuentas con perfil/evento distintos
      producen calorie target y sesiones distintas (`quickstart.md` §2, paso 8) —
      confirmado con el script de comparación lado a lado (ver research.md)

**Checkpoint**: El plan de cada cuenta es realmente propio, no una copia del de otra.

---

## Phase 5: User Story 3 - La cuenta de Brian migra sin cambios (Priority: P1)

- [x] T016 [US3] `specs/004-multi-user-onboarding/contracts/brian-migration.sql`:
      perfil + 3 eventos reales con `etiqueta`/`detalle` exactos (research.md
      Decisión 2) + `onboarding_completed = true` en `user_metadata`
- [x] T017 [US3] Ejecutado contra la cuenta real de Brian (con reintento: su cuenta
      ya tenía una fila de `perfil`/`evento` de una prueba anterior de signup, se
      limpió con `delete` + `on conflict do update` antes del insert real)
- [x] T018 [US3] Validación manual (`quickstart.md` §3): login directo a
      `/calendario` sin pasar por onboarding, confirmado por el usuario; historial de
      `registro` intacto

**Checkpoint**: Brian es el primer usuario del sistema nuevo, sin caso especial en el
código y sin pérdida de datos.

---

## Phase 6: Deploy

- [x] T019 Sitio Netlify `bakata` creado (separado del sitio personal preexistente
      `plandevida2026`, no tocado), env vars cargadas (`netlify env:set`)
- [x] T020 Widget de Turnstile de producción: `bakata.netlify.app` agregado como
      segundo dominio al mismo widget de desarrollo (research.md Decisión 6)
- [x] T021 Deploy inicial (`netlify deploy --prod --build`) + conexión a
      `brian-pitz-dev/proyecto-integrador` para deploy continuo (vía dashboard,
      `netlify init` requiere un menú interactivo que no se pudo automatizar)
- [x] T022 Smoke test de producción: `/`, `/login`, `/signup` → 200; `/calendario`
      sin sesión → redirect; login real de Brian → directo a `/calendario`

**Checkpoint**: Núcleo completo, desplegado, y usable por cualquiera en
`https://bakata.netlify.app`.

---

## Pendiente (fases separadas, no parte de este tasks.md)

Fase B (comidas por IA), Fase C (ejercicios por IA), Fase D (fotos de progreso) —
diseñadas en `.claude/plans/enumerated-humming-iverson.md` §7-9, implementación
futura con su propio tasks.md cuando arranquen.
