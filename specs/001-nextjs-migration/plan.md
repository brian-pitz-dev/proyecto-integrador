# Implementation Plan: Migración a Next.js con Diseño Renovado

**Branch**: `001-nextjs-migration` | **Date**: 2026-08-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-nextjs-migration/spec.md`

## Summary

Reconstruir `plan_vida_2026.html` como una app Next.js (App Router) + TypeScript,
conectada al mismo proyecto y schema de Supabase (tabla `registro`, sin
modificaciones), preservando exactamente el registro de ejercicio (running,
caminata, gym), el registro de dieta/salud (calorías, peso, sueño, objetivo
calórico), el calendario de días completados y las alertas de racha/ritmo. Lecturas
vía Server Components; mutaciones (guardar/borrar/toggle) vía Server Actions con
`revalidatePath`. UI con shadcn/ui + Tailwind CSS según `ui-ux-pro-max`. Sin
autenticación en esta etapa (app privada/local, ver Clarifications en spec.md).

## Technical Context

**Language/Version**: TypeScript (modo estricto) sobre Next.js, runtime Node.js LTS

**Primary Dependencies**: Next.js (App Router), `@supabase/ssr` +
`@supabase/supabase-js`, Tailwind CSS, shadcn/ui (Radix UI)

**Storage**: Supabase Postgres existente — tabla única `registro`, schema sin
modificaciones (Principio IV de la constitución; ver `data-model.md`)

**Testing**: Validación manual guiada por `quickstart.md` en esta etapa (proyecto
personal, sin suite automatizada previa que preservar); no bloquea el alcance
definido en spec.md

**Target Platform**: Web, entorno privado/local (sin URL pública en esta etapa —
ver Clarifications en spec.md)

**Project Type**: Web app (Next.js full-stack: Server Components + Server Actions,
sin backend separado)

**Performance Goals**: Carga de cualquier registro en <15s desde apertura de la app
(SC-001); sin metas de throughput adicionales — uso de un único usuario

**Constraints**: Sin autenticación en esta etapa; sin cambios de schema en
Supabase; debe funcionar sin scroll horizontal desde 360px hasta 1920px (SC-004)

**Scale/Scope**: Un usuario, 3 secciones (registro, calendario, estadísticas), 6
categorías de registro sobre una sola tabla

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principio                             | Cumplimiento                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| I. Next.js + TypeScript Stack         | ✅ App Router + TypeScript estricto elegidos explícitamente (research.md §1)                                                                |
| II. Documentación vía Context7        | ✅ Decisiones de Next.js/Supabase validadas contra `/vercel/next.js` y `/supabase/ssr` en research.md, no contra memoria                    |
| III. Diseño visual bajo ui-ux-pro-max | ✅ Stack de UI (shadcn/ui + Tailwind) tomado del sub-skill `ui-styling` de `ui-ux-pro-max` (research.md §5)                                 |
| IV. Schema de Supabase inmutable      | ✅ `data-model.md` documenta el schema existente sin proponer ningún cambio; ninguna tarea de esta etapa incluye `ALTER`/`DROP`/migraciones |

**Resultado**: PASS. Sin violaciones que requieran justificación en Complexity
Tracking.

_(Re-chequeado post Fase 1: sin cambios — data-model.md y contracts/ no introducen
ninguna estructura nueva de Supabase ni se apartan del stack fijado.)_

## Project Structure

### Documentation (this feature)

```text
specs/001-nextjs-migration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/
│   └── server-actions.md
└── tasks.md              # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
app/
├── layout.tsx                  # Server Component raíz (nav, tema)
├── page.tsx                    # Redirect/landing a la sección de registro
├── registro/
│   ├── page.tsx                 # Server Component: formularios + últimos registros
│   └── actions.ts                # Server Actions: saveLog, deleteLog
├── calendario/
│   ├── page.tsx                  # Server Component: calendario semanal
│   └── actions.ts                # Server Action: toggleDayDone
└── estadisticas/
    └── page.tsx                  # Server Component: rachas, alertas, objetivo calórico

components/
├── ui/                          # Componentes shadcn/ui generados (button, card, dialog, form, ...)
├── log-form/                    # Client Components: un form por categoría (tirada, caminata, calorías, peso, sueño)
├── calendar-grid/                # Client Component: grilla de días + toggle
└── stats/                        # Server/Client Components de rachas y alertas

lib/
└── supabase/
    ├── client.ts                 # createBrowserClient (research.md §3)
    └── server.ts                 # createServerClient (research.md §3)
```

**Structure Decision**: Next.js App Router de proyecto único (no hay
frontend/backend separados — Server Components y Server Actions viven en el mismo
proyecto `app/`). Se elige esta sobre la Option 2 (frontend+backend) porque no hay
ningún servicio externo propio: la única dependencia externa es Supabase, consumida
directamente desde `lib/supabase/`.

## Complexity Tracking

_Sin violaciones de Constitution Check — sección no aplica._
