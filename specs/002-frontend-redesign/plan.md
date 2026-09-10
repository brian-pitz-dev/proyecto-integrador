# Implementation Plan: Rediseño de Frontend

**Branch**: `002-frontend-redesign` | **Date**: 2026-08-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-frontend-redesign/spec.md`

## Summary

Rediseño completo del frontend de PlandeVida2026 (Next.js App Router ya migrado en 001) sobre las 4 pantallas existentes (inicio, registro, calendario, estadísticas) más una página nueva de contenido estático (nutrición): nueva paleta e identidad visual en modo oscuro con `next-themes`, tipografía `JetBrains_Mono` vía `next/font/google`, navegación por sidebar desplegable (3 secciones: Plan de gimnasio → `/calendario`, Nutrición → `/nutricion`, Stats → `/estadisticas`) con equivalente drawer en mobile reemplazando la bottom-nav actual, carga de datos movida a un modal por categoría (`<Dialog>` ya instalado) en vez de formularios siempre visibles, la página `/nutricion` con el plan de comidas portado 1:1 desde `plan_vida_2026.html` (gap de la migración 001, nunca documentado como decisión de scope), un selector de semanas compartido entre Calendario y Nutrición agrupado por mes (con marca visual de semanas de evento/preparación, otro gap de 001), animaciones de confirmación/transición respetando `prefers-reduced-motion`, y metadata técnica básica (404 propia, meta descriptions únicas, `sitemap.xml`, favicon, copyright dinámico). Todo se implementa reutilizando dependencias ya instaladas (shadcn `base-nova`, `@base-ui/react`, Tailwind 4, `tw-animate-css`) vía el skill `ui-ux-pro-max --design-system`, sin cambios de esquema de Supabase (el plan de comidas es una constante en código, igual que `lib/training-plan.ts`).

## Technical Context

**Language/Version**: TypeScript 5 (modo estricto), React 19.2, Next.js 16.3.3 (App Router)

**Primary Dependencies**: Tailwind CSS 4 + shadcn (`components.json` → `style: base-nova`), `@base-ui/react`, `next-themes`, `lucide-react`, `sonner`, `tw-animate-css`, `class-variance-authority`, `clsx`/`tailwind-merge` — todas ya presentes en `package.json`, ninguna dependencia nueva

**Storage**: Supabase (sin cambios de esquema — Principio IV de la constitución)

**Testing**: Manual vía `quickstart.md`; no hay framework de test en el repo (sin `vitest`/`jest`), consistente con el estado actual del proyecto

**Target Platform**: Web responsive, 360px–1920px, Next.js SSR/RSC en el navegador

**Project Type**: Web app de un solo proyecto (Next.js App Router, sin split frontend/backend)

**Performance Goals**: Respuesta animada perceptible en <300ms desde la interacción (SC-003)

**Constraints**: Sin scroll horizontal ni elementos cortados entre 360px y 1920px (SC-004 heredado de 001, FR-010); toda animación debe respetar `prefers-reduced-motion` (FR-005, SC-005)

**Scale/Scope**: 5 páginas de contenido (inicio, registro, calendario, estadísticas, nutrición — nueva) + página 404 + `sitemap.xml`; un único usuario final (Brian)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principio                                  | Chequeo                                                                                                                                                                                                                                                                                                                                                                                  | Estado                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| I. Next.js + TypeScript Stack              | Todo código nuevo (sidebar, modales, tokens) va en TS estricto, respetando convenciones de App Router / server-client components existentes                                                                                                                                                                                                                                              | PASS                                 |
| II. Documentación Actualizada vía Context7 | Antes de implementar patrones de Next.js 16 (metadata API para SEO/US5, App Router) o Supabase que no estén ya resueltos en el código existente, se consulta context7                                                                                                                                                                                                                    | PASS (a verificar en implementación) |
| III. Diseño Visual bajo ui-ux-pro-max      | Todo el rediseño (paleta, tipografía, tokens, sidebar, motion) se ejecuta a través de `ui-ux-pro-max --design-system`, sin sistema de diseño paralelo — ver research.md Decisión 3-5                                                                                                                                                                                                     | PASS                                 |
| IV. Schema de Supabase Inmutable           | Ninguna decisión de este plan toca tablas/columnas/RLS; el modal de carga reusa la misma forma de dato (`Registro`) que los formularios actuales; el plan de comidas nuevo (`/nutricion`) se modela como constante en código (`lib/meal-plan.ts`), igual que `lib/training-plan.ts`, sin persistencia en Supabase — no dispara el requisito de aprobación explícita de cambio de esquema | PASS                                 |

**Re-chequeo post-diseño (Fase 1)**: data-model.md confirma que no se agregan entidades de negocio persistidas ni cambios de esquema — el plan de comidas es contenido estático en código (mismo patrón que el plan de gimnasio), y el resto son design tokens y estado de UI cliente. Sin violaciones. Gate sigue en PASS.

## Project Structure

### Documentation (this feature)

```text
specs/002-frontend-redesign/
├── plan.md              # Este archivo
├── research.md          # Fase 0 — decisiones de mapeo de nav, modal, tema, tipografía, sidebar, testing
├── data-model.md         # Fase 1 — design tokens y estado de UI (sin entidades de negocio nuevas)
├── quickstart.md         # Fase 1 — guía de validación manual por User Story
├── checklists/
│   └── requirements.md
└── tasks.md              # Fase 2 (/speckit-tasks) — no generado por /speckit-plan
```

No se genera `contracts/`: esta feature no expone ni consume una interfaz externa nueva (no hay API pública, endpoint o esquema de datos nuevo) — es un rediseño visual sobre las páginas y componentes ya existentes, consumiendo la misma capa de datos de Supabase sin cambios.

### Source Code (repository root)

```text
app/
├── layout.tsx            # Nav actual (header sticky desktop + bottom-nav mobile) → pasa a sidebar + drawer
├── globals.css           # Tokens de color/tipografía (oklch) → paleta nueva, --font-mono real
├── page.tsx               # Inicio
├── not-found.tsx          # NUEVO — página 404 personalizada (FR-012)
├── sitemap.ts              # NUEVO — sitemap.xml vía Metadata API de Next.js (FR-013)
├── registro/page.tsx       # Cards por categoría con stat + trigger de modal (FR-011)
├── calendario/page.tsx     # Sin cambios de datos; nueva jerarquía visual (FR-006)
├── estadisticas/page.tsx   # Sin cambios de datos; nueva jerarquía visual (FR-006)
└── nutricion/page.tsx      # NUEVO — plan de comidas del día/semana (FR-015/017/018)

components/
├── nav/                    # NUEVO — sidebar desktop + drawer mobile (reemplaza la nav inline de layout.tsx)
├── log-form/*.tsx           # Cada *-form.tsx pasa a vivir dentro de un <Dialog> (components/ui/dialog.tsx)
├── nutrition/                # NUEVO — tarjetas de comida por día, reglas fijas (consume lib/meal-plan.ts)
├── week-selector/             # NUEVO — selector mes→semana + marca de evento/preparación, compartido por Calendario y Nutrición
├── stats/                   # gym-streak-alert / run-pace-alert — ajuste visual, sin cambio de lógica
└── ui/                      # Componentes shadcn ya instalados (dialog, card, button, etc.), reutilizados

lib/
├── meal-plan.ts             # NUEVO — banco de comidas + rotación + refuerzo de proteína, portado de plan_vida_2026.html (FR-016/018)
├── training-plan.ts          # Se agrega getWeeks() (o similar) exportando num/start/phase/isEventWeek/isPrepWeek (FR-021) — sin tocar la lógica de sesiones existente
└── (resto sin cambios de lógica de negocio — Principio IV)
```

**Structure Decision**: Se mantiene el proyecto Next.js único (App Router) tal como quedó en 001-nextjs-migration; no hay separación frontend/backend ni proyecto nuevo. Los archivos/directorios nuevos son de presentación y metadata (`components/nav/`, `app/not-found.tsx`, `app/sitemap.ts`, metadata por página vía Next.js Metadata API para FR-013/014), la página y datos de Nutrición (`app/nutricion/page.tsx`, `components/nutrition/`, `lib/meal-plan.ts` — contenido estático portado, sin tocar Supabase), y el selector de semanas compartido (`components/week-selector/`, más una extensión no disruptiva de `lib/training-plan.ts` para exponer `getWeeks()`); todo lo demás son ediciones in-place de componentes y estilos existentes.

## Complexity Tracking

_Sin violaciones de la Constitution Check — sección no aplica._
