# Implementation Plan: Multi-User Onboarding & Personalized Plan Generation

**Branch**: `main` (sin branch dedicada — repo chico, un solo desarrollador) | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-multi-user-onboarding/spec.md`

## Summary

Despersonaliza la app: reemplaza las constantes hardcodeadas para un único usuario
(Brian) — eventos, fases de entrenamiento, perfil fisiológico — por datos propios de
cada cuenta, con signup público protegido (Turnstile + rate limit, mismo patrón que
`/login`), onboarding que captura perfil + al menos un evento (FR-004), y un motor de
fases (`buildPlan`) que calcula el plan de gym/calorías relativo a los eventos de
cada usuario en vez de fechas de calendario fijas (ver research.md Decisión 1 para la
resolución de la Open Design Question del spec). La cuenta de Brian migra como primer
usuario del sistema nuevo y reproduce exactamente su plan actual (FR-012/FR-013,
verificado numéricamente — ver research.md y quickstart.md).

Alcance de este corte: **núcleo** (US1/US2/US3, prioridad P1). US4 (comidas/
ejercicios propios, generados por IA) y US5 (gestión completa de eventos) quedan como
fases B/C/D separadas, diseñadas pero no implementadas — ver
`.claude/plans/enumerated-humming-iverson.md` para el diseño completo de las 4 fases.

**Estado actual**: núcleo implementado, desplegado en producción
(`https://bakata.netlify.app`, conectado a `brian-pitz-dev/proyecto-integrador` para
deploy continuo) y validado con una cuenta de prueba real además de la migración de
Brian.

## Technical Context

**Language/Version**: TypeScript 5 (modo estricto), React 19.2, Next.js 16.4 (App
Router), mismo stack que specs 001-003.

**Primary Dependencies**: sin dependencias nuevas — reusa `@supabase/ssr`, `zod`,
Cloudflare Turnstile (mismo patrón que spec 003, con `verifyTurnstileToken` extendido
a recibir un `action` parametrizable en vez de hardcodear `"login"`).

**Storage**: Supabase Postgres — 2 tablas nuevas (`perfil`, `evento`), ambas con RLS
owner-scoped idéntico al de `registro` (Principio IV de la constitución — aprobación
explícita en spec.md Key Entities). `registro` no se modifica.

**Testing**: Manual vía `quickstart.md`, consistente con specs 001-003. La pieza más
riesgosa (el motor de fases) se verificó además con un script `tsx` ad-hoc
comparando semana a semana contra el comportamiento hardcodeado original, no solo con
el quickstart manual — ver research.md Decisión 1.

**Target Platform**: Web responsive, desplegado en Netlify (`bakata.netlify.app`),
deploy continuo desde GitHub.

**Project Type**: Web app de un solo proyecto (Next.js App Router), sin split
frontend/backend — sin cambios respecto a specs anteriores.

**Performance Goals**: `buildPlan` es puro y barato (recorre ≤3-5 eventos por
usuario en la práctica); se recalcula en cada request de Server Component sin
necesidad de cachear — sin objetivo de performance nuevo más allá de eso.

**Constraints**: el rate limiting de `/signup` reusa el mismo limiter en memoria de
proceso que `/login` (spec 003 Decisión 6) — mismo ceiling documentado, sin backing
store nuevo. El gate de onboarding en `proxy.ts` no agrega queries nuevas por
request (research.md Decisión 3).

**Scale/Scope**: multi-usuario real por primera vez — meta de spec.md es soportar
≥20 cuentas concurrentes sin fuga de datos entre usuarios (SC-005); 2 rutas nuevas
(`/signup`, `/onboarding`) + 3 rutas existentes adaptadas a leer perfil/eventos
propios (`/calendario`, `/estadisticas`, `/nutricion`); 2 tablas nuevas.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principio                                                 | Chequeo                                                                                                                                                                                             | Estado |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| I. Next.js + TypeScript Stack                             | Todo código nuevo (`buildPlan`, `app/signup/`, `app/onboarding/`, `lib/user-plan.ts`) en TS estricto, siguiendo las convenciones de App Router / Server Actions ya establecidas en specs 001-003    | PASS   |
| II. Documentación Actualizada vía Context7                | Sin APIs nuevas de Next.js/Supabase respecto a specs 001-003 (mismo patrón `@supabase/ssr`, mismas Server Actions) — no requirió consulta nueva a context7                                          | PASS   |
| III. Diseño Visual bajo ui-ux-pro-max                     | `SignupForm`/`OnboardingForm` reusan los componentes shadcn/`@base-ui/react` ya instalados (`Card`, `Input`, `Label`, `Button`), sin sistema de diseño paralelo                                     | PASS   |
| IV. Schema de Supabase Inmutable sin Aprobación Explícita | `perfil`/`evento` están explícitamente aprobadas en spec.md (sección Key Entities + Assumptions, "per el constitution... este spec constituye esa aprobación") — ver `data-model.md` y `contracts/` | PASS   |

## Fases del plan completo (para referencia)

1. **Fase A — Núcleo** (este plan): implementada y desplegada.
2. **Fase B**: plan de comidas generado por IA (bloqueada en `ANTHROPIC_API_KEY`).
3. **Fase C**: plan de ejercicios generado por IA (misma dependencia que B).
4. **Fase D**: fotos de progreso en Estadísticas (requiere bucket de Supabase
   Storage).

Diseño detallado de B/C/D en `.claude/plans/enumerated-humming-iverson.md` — se
promueven a su propio research.md/data-model.md cuando se implementen.
