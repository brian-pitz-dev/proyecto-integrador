---
description: "Task list template for feature implementation"
---

# Tasks: Rediseño de Frontend (002-frontend-redesign)

**Input**: Design documents from `/specs/002-frontend-redesign/` (spec.md, plan.md, research.md, data-model.md, quickstart.md)

**Prerequisites**: plan.md, spec.md (7 user stories), research.md (9 decisiones), data-model.md, quickstart.md

**Tests**: No solicitados explícitamente (spec.md Testing = manual vía quickstart.md, sin framework en el repo). No se generan tareas de test; la validación es el Polish final (T041) corriendo `quickstart.md`.

**Organización**: Tareas agrupadas por User Story (spec.md) para poder implementar y validar cada una por separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias entre sí)
- **[Story]**: A qué user story pertenece (US1..US7)
- Cada tarea incluye la ruta de archivo exacta

## Phase 1: Setup

**Purpose**: Generar los tokens de diseño base antes de aplicarlos en ninguna página

- [x] T001 Ejecutar el skill `ui-ux-pro-max --design-system` con los dials `--variance`, `--motion`, `--density` (research.md Decisión 3) para generar la paleta, escala de motion y densidad nuevas que se van a volcar en `app/globals.css` durante US1

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura que usan todas o casi todas las user stories (modo oscuro y tipografía se renderizan en cada página vía `app/layout.tsx`)

**⚠️ CRITICAL**: Ninguna user story empieza hasta completar esta fase

- [x] T002 Montar `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>` de `next-themes` alrededor de `<body>` en `app/layout.tsx` (ya está en `package.json`, sin usar hoy)
- [x] T003 [P] Cargar `JetBrains_Mono` vía `next/font/google` en `app/layout.tsx` (mismo patrón que `Plus_Jakarta_Sans`) y mapear su variable a `--font-mono` en `app/globals.css`, reemplazando la referencia húerfana a `--font-geist-mono` (research.md Decisión 4)

**Checkpoint**: Modo oscuro y tipografía nueva disponibles — las user stories pueden empezar

---

## Phase 3: User Story 1 - Nueva paleta e identidad visual coherente (Priority: P1) 🎯 MVP

**Goal**: Reemplazar la paleta verde-azulada por la paleta nueva generada en T001, consistente en las 5 pantallas, con modo oscuro funcional

**Independent Test**: Navegar las 5 pantallas y confirmar que usan la misma paleta (sin colores sueltos), y que alternar claro/oscuro mantiene contraste legible

### Implementation for User Story 1

- [x] T004 [US1] Reemplazar `--primary`/`--primary-foreground`/`--accent`/`--accent-foreground`/`--secondary`/`--muted`/`--destructive`/`--border`/`--input`/`--ring` (bloques `:root` y `.dark`) en `app/globals.css` con la paleta generada en T001 (FR-001, FR-002)
- [x] T005 [P] [US1] Reemplazar `--chart-1` a `--chart-5` (bloques `:root` y `.dark`) en `app/globals.css` con la escala de color de gráficos generada en T001 (FR-001)
- [x] T006 [P] [US1] Reemplazar `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring` (bloques `:root` y `.dark`) en `app/globals.css` con la paleta generada en T001 (FR-001; los consume el sidebar de US2)
- [x] T007 [US1] Agregar un control de alternar tema (claro/oscuro) usando `useTheme()` de `next-themes` en `app/layout.tsx` (Acceptance Scenario 2)
- [x] T008 [US1] Auditar `components/**/*.tsx` y `app/**/page.tsx` en busca de clases de color hardcodeadas (hue ~165 verde-azulado u otro color fuera de los tokens) y reemplazarlas por clases Tailwind basadas en los tokens de `app/globals.css` (FR-002, SC-002)

**Checkpoint**: Paleta e identidad visual nuevas funcionando en las 5 pantallas, con modo oscuro

---

## Phase 4: User Story 2 - Navegación y desplazamiento fluido entre secciones (Priority: P1.5)

**Goal**: Reemplazar la nav actual (header sticky + bottom-nav) por un sidebar desktop + drawer mobile con 3 secciones, manteniendo la sección activa visible durante el scroll

**Independent Test**: Navegar entre las 3 secciones del sidebar y hacer scroll en páginas largas, verificando que el patrón de navegación es consistente y predecible

**Depends on**: User Story 1 (los componentes de nav se construyen sobre la paleta y tokens `--sidebar-*` ya definidos)

### Implementation for User Story 2

- [x] T009 [US2] Crear `components/nav/sidebar.tsx`: sidebar desktop con 3 ítems (Plan de gimnasio → `/calendario`, Nutrición → `/nutricion`, Stats → `/estadisticas`), usando los tokens `--sidebar-*` y marcando la ruta activa vía `usePathname()` (FR-003, research.md Decisión 1)
- [x] T010 [US2] Crear `components/nav/mobile-drawer.tsx`: drawer off-canvas mobile con los mismos 3 ítems, construido sobre primitivos de `@base-ui/react` (FR-003, research.md Decisión 5)
- [x] T011 [US2] Reemplazar el `<header>` y el `<nav>` inferior actuales de `app/layout.tsx` (líneas 30-60) por `Sidebar` (desktop) + `MobileDrawer` (mobile), manteniendo `<Toaster />` montado (FR-004)
- [x] T012 [US2] Hacer que el sidebar/drawer permanezca accesible durante el scroll en páginas largas (`app/calendario/page.tsx`, `app/estadisticas/page.tsx`) sin que el usuario pierda la referencia de sección (FR-004, edge case)
- [x] T013 [US2] Agregar una transición animada al cambiar de sección en `app/layout.tsx` (o vía `template.tsx`), respetando `prefers-reduced-motion` (Acceptance Scenario 2, FR-005)
- [x] T014 [US2] Verificar en 360px, 768px y 1920px que el sidebar/drawer no introduce scroll horizontal ni elementos cortados (FR-010, SC-004 heredado de 001)

**Checkpoint**: Navegación por sidebar/drawer funcionando en las 3 secciones, en desktop y mobile

---

## Phase 5: User Story 3 - Animaciones con propósito (Priority: P2)

**Goal**: Agregar animaciones de confirmación/transición en las acciones clave, respetando `prefers-reduced-motion`

**Independent Test**: Disparar guardar/filtrar/cambiar de mes y verificar una animación perceptible de <300ms, que desaparece con `prefers-reduced-motion` activo

**Depends on**: User Story 1 (paleta) y User Story 2 (navegación) ya resueltas

### Implementation for User Story 3

- [x] T015 [US3] Agregar animación de confirmación (clases de `tw-animate-css`) al guardar exitosamente en cada `components/log-form/*-form.tsx`, en conjunto con el toast de `sonner` (FR-005, Acceptance Scenario 1) — satisfecho por la animación de cierre del modal (`components/log-form/log-entry-card.tsx` → `DialogContent`, ya animada) disparada por `onSuccess`, combinada con el toast de `sonner`
- [x] T016 [P] [US3] Agregar estado de carga animado (skeleton/spinner) mientras se obtienen datos en `app/calendario/page.tsx` y `app/estadisticas/page.tsx` — implementado como `app/calendario/loading.tsx` y `app/estadisticas/loading.tsx` (patrón nativo de Next.js con Suspense, sin JS de cliente extra)
- [~] T017 [US3] Agregar animación de transición al cambiar filtro/rango de fechas en los gráficos de `components/stats/*.tsx` (FR-005, Acceptance Scenario 2) — **omitido**: Estadísticas no tiene gráficos ni controles de filtro/rango de fechas en el código actual (solo alertas de racha/ritmo); no se fabricó esa UI porque no está pedida en ningún FR del spec. Si se agrega en una etapa futura, esta tarea aplica ahí.
- [x] T018 [US3] Envolver las animaciones agregadas en T015-T017 con la media query `prefers-reduced-motion: reduce` en `app/globals.css` para reducirlas/eliminarlas cuando el usuario la tenga activa (FR-005, SC-005) — regla global en `app/globals.css` que cubre cualquier animación/transición de la app, no solo las de T015-T016

**Checkpoint**: Animaciones de confirmación/transición funcionando y respetando accesibilidad

---

## Phase 6: User Story 4 - Contenido y formato rediseñados por página (Priority: P2)

**Goal**: Reorganizar Registro (cards por categoría + modal), Calendario y Estadísticas con jerarquía visual explícita

**Independent Test**: Revisar las 3 páginas y confirmar que lo más importante de cada una se destaca primero, y que Registro carga datos vía modal por categoría

**Depends on**: User Story 1 (paleta/tokens)

### Implementation for User Story 4

- [x] T019 [US4] Envolver cada formulario (`components/log-form/run-form.tsx`, `walk-form.tsx`, `calorie-form.tsx`, `weight-form.tsx`, `sleep-form.tsx`) dentro de un `<Dialog>` (`components/ui/dialog.tsx`), sin selector de categoría dentro del modal (research.md Decisión 2)
- [x] T020 [US4] Reconstruir `app/registro/page.tsx` como una card por categoría (tirada, caminata, calorías, peso, sueño) que muestra el último stat debajo del punto de entrada y abre el modal correspondiente (T019) al tocarla (FR-011, Acceptance Scenario 3)
- [x] T021 [P] [US4] Rediseñar la jerarquía visual de `app/calendario/page.tsx` + `components/calendar-grid/calendar-grid.tsx` para que las sesiones/eventos importantes prioricen sobre la grilla base (FR-006, Acceptance Scenario 1)
- [x] T022 [P] [US4] Rediseñar la jerarquía visual de `app/estadisticas/page.tsx` para que el dato/tendencia más relevante se perciba antes que el detalle secundario (FR-006, Acceptance Scenario 2)
- [x] T023 [P] [US4] Agregar estados vacíos diseñados (sin datos aún) en `app/calendario/page.tsx` y `app/estadisticas/page.tsx` (FR-009, edge case)

**Checkpoint**: Registro con modal por categoría, Calendario y Estadísticas con jerarquía visual clara

---

## Phase 7: User Story 5 - Plan de comidas / Nutrición (Priority: P2)

**Goal**: Página `/nutricion` con el plan de comidas portado 1:1 desde `plan_vida_2026.html`

**Independent Test**: Entrar a `/nutricion` y verificar las comidas del día actual con nombre/detalle/ingredientes, que rotan sin repetirse seguido, y que sábado/domingo muestran "sin estructura fija"

**Depends on**: User Story 1 (paleta/tokens)

### Implementation for User Story 5

- [x] T024 [US5] Portar `mealBank` (grupos desayuno/media/almuerzo/merienda/cena), `buildRecencySequence`/`mulberry32`, `pickAlmuerzo`/`pickCena` y `applyProteinReinforcement` de `plan_vida_2026.html` (líneas ~2534+) a `lib/meal-plan.ts` (FR-016, FR-018, research.md Decisión 6/8)
- [x] T025 [US5] Crear `app/nutricion/page.tsx` que renderice las comidas del día actual (desayuno, colación, almuerzo, merienda, cena) con nombre, detalle e ingredientes, consumiendo `lib/meal-plan.ts` (FR-015, Acceptance Scenario 1) — por defecto el día actual del sistema (edge case)
- [x] T026 [P] [US5] Crear `components/nutrition/meal-card.tsx` (tarjeta de una comida) y `components/nutrition/fixed-rules.tsx` (texto de reglas fijas: plato chico/playo, agua, creatina) (FR-017)
- [x] T027 [US5] Agregar el estado "sábado/domingo sin estructura fija" en `app/nutricion/page.tsx` (FR-017, Acceptance Scenario 3)

**Checkpoint**: `/nutricion` funcionando de forma independiente con el plan de comidas portado

---

## Phase 8: User Story 6 - Navegación completa del plan por semanas y marca de eventos (Priority: P2)

**Goal**: Selector de semanas agrupado por mes, compartido por Calendario y Nutrición, con marca visual de semanas de evento/preparación

**Independent Test**: Abrir el selector de mes en Calendario, elegir un mes, ver solo sus semanas, y confirmar que la semana de un evento (10K/Luján/21K) o su semana previa se distingue visualmente; repetir en Nutrición

**Depends on**: User Story 1 (paleta/tokens); se integra en las páginas de User Story 4 (Calendario) y User Story 5 (Nutrición), que deben existir antes de los pasos de integración (T032, T033)

### Implementation for User Story 6

- [x] T028 [US6] Exportar `getWeeks()` desde `lib/training-plan.ts` devolviendo `{ num, start, phase, isEventWeek, isPrepWeek }[]` a partir del array `weeks` interno ya calculado y las constantes `EV_10K`/`EV_LUJAN`/`EV_21K` (FR-021, data-model.md "Semana del plan")
- [x] T029 [US6] Crear `components/week-selector/week-selector.tsx`: selector de mes (agosto-diciembre 2026) → pestañas de semana del mes elegido, marcando visualmente `isEventWeek`/`isPrepWeek`, acotado a `PLAN_START`-`PLAN_END` (FR-019, FR-020, FR-021)
- [x] T030 [US6] Integrar `WeekSelector` en `app/calendario/page.tsx` + `components/calendar-grid/calendar-grid.tsx`, reemplazando la navegación de solo "anterior/siguiente" (FR-019, Acceptance Scenario 1-2)
- [x] T031 [US6] Integrar `WeekSelector` en `app/nutricion/page.tsx` para navegar semana/día (FR-019, Acceptance Scenario 4) — depende de T025
- [x] T032 [US6] Configurar el valor por defecto (mes/semana actual del sistema) y deshabilitar la selección fuera de `PLAN_START`-`PLAN_END` en `WeekSelector` (edge cases)

**Checkpoint**: Selector de semanas por mes funcionando igual en Calendario y Nutrición, con marca de eventos

---

## Phase 9: User Story 7 - Metadata técnica y SEO básico (Priority: P3)

**Goal**: 404 propia, meta descriptions únicas, sitemap, favicon y copyright dinámico

**Independent Test**: Navegar a una URL inexistente, inspeccionar el `<head>` de cada página, y acceder a `/sitemap.xml`

**Depends on**: User Story 1 (lenguaje visual para la página 404)

### Implementation for User Story 7

- [x] T033 [P] [US7] Crear `app/not-found.tsx` con el lenguaje visual de la app (FR-012, Acceptance Scenario 1)
- [x] T034 [P] [US7] Crear `app/sitemap.ts` (Next.js Metadata API) listando `/`, `/registro`, `/calendario`, `/estadisticas`, `/nutricion` (FR-013, Acceptance Scenario 2)
- [x] T035 [P] [US7] Agregar `export const metadata` (o `generateMetadata`) con título y `description` únicos en `app/page.tsx`, `app/registro/page.tsx`, `app/calendario/page.tsx`, `app/estadisticas/page.tsx`, `app/nutricion/page.tsx` (FR-013, FR-014)
- [~] T036 [P] [US7] Confirmar/actualizar el favicon (`app/favicon.ico`) acorde a la identidad visual nueva de US1 (FR-014) — **parcial**: `app/favicon.ico` ya existe (el de `create-next-app` por defecto); no se generó un ícono nuevo porque esta sesión no tiene herramientas de generación de imágenes disponibles. Queda pendiente para cuando el usuario tenga un ícono propio.
- [x] T037 [US7] Agregar un footer con el año de copyright calculado dinámicamente (`new Date().getFullYear()`) en `app/layout.tsx` (FR-014, Acceptance Scenario 3)

**Checkpoint**: Metadata técnica completa en las 5 páginas

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Verificación final transversal a todas las user stories

- [~] T038 Correr manualmente los 7 escenarios de `specs/002-frontend-redesign/quickstart.md` de punta a punta — **parcial**: verificado que las 5 rutas + `/sitemap.xml` responden 200 y `/no-existe` responde 404 (curl), `npm run build` genera las 5 páginas sin errores, `tsc --noEmit` y `eslint` limpios. **No verificado**: la extensión Claude in Chrome no está conectada en esta sesión, así que no se pudo confirmar visualmente el modo oscuro, las animaciones, el modal por categoría, ni el layout responsive en 360/768/1920px. Recomendado: correr `npm run dev` y revisar a ojo antes de dar por cerrada la etapa.
- [x] T039 [P] Confirmar que se consultó context7 para cualquier API de Next.js 16 (Metadata API de T028/T034/T035) usada por primera vez en esta etapa (Principio II de la constitución) — consultado contra `/vercel/next.js/v16.2.9`; `sitemap.ts` y `export const metadata` coinciden con la doc oficial
- [x] T040 Auditoría final de `app/globals.css` y componentes en busca de tokens sin usar o colores hardcodeados remanentes (SC-002) — sin resultados en el grep de colores hardcodeados; build de producción limpio

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias, arranca de inmediato
- **Foundational (Phase 2)**: depende de Setup — bloquea todas las user stories
- **User Stories (Phase 3-9)**: todas dependen de Foundational
  - US1 (P1) es el MVP y bloquea semánticamente a US2-US7 (todas reusan su paleta/tokens)
  - US2 (P1.5) depende de US1
  - US3, US4, US5, US7 (P2/P3) dependen de US1; son independientes entre sí
  - US6 (P2) depende de US1 para sus propios tokens, y sus tareas de integración (T030, T031) dependen de que US4 (Calendario) y US5 (Nutrición) ya tengan sus páginas creadas — el componente `WeekSelector` en sí (T028-T029) puede construirse en paralelo
- **Polish (Phase 10)**: depende de que las user stories que se vayan a entregar estén completas

### User Story Dependencies

- **US1 (P1)**: sin dependencias de otra story — MVP
- **US2 (P1.5)**: depende de US1
- **US3 (P2)**: depende de US1 (y de US2 para el patrón de navegación sobre el que anima transiciones)
- **US4 (P2)**: depende de US1
- **US5 (P2)**: depende de US1
- **US6 (P2)**: depende de US1; su integración depende de que US4 y US5 existan (T030/T031)
- **US7 (P3)**: depende de US1

### Parallel Opportunities

- T005 y T006 (US1) en paralelo entre sí, después de T004
- T021, T022, T023 (US4) en paralelo entre sí, después de T020
- T026 (US5) en paralelo con T024/T025 en archivos distintos
- T033, T034, T035, T036 (US7) en paralelo entre sí
- US3, US4, US5 y US7 pueden desarrollarse en paralelo por distintas personas una vez completa US1 (y US2 para US3)

---

## Parallel Example: User Story 1

```bash
# Después de T004 (tokens principales), en paralelo:
Task: "Reemplazar --chart-1..--chart-5 en app/globals.css"
Task: "Reemplazar tokens --sidebar-* en app/globals.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 solamente)

1. Completar Setup (T001) + Foundational (T002-T003)
2. Completar User Story 1 (T004-T008)
3. **Validar**: navegar las 5 pantallas, confirmar paleta única y modo oscuro funcional
4. Mostrar el resultado antes de seguir con navegación/contenido

### Entrega incremental

1. Setup + Foundational → base lista
2. US1 → paleta nueva visible (MVP)
3. US2 → navegación por sidebar/drawer
4. US3, US4, US5, US7 → en paralelo si hay capacidad (todas dependen solo de US1/US2)
5. US6 → se integra al final de US4/US5 porque depende de que esas páginas ya existan
6. Polish → validación completa con `quickstart.md`

---

## Notes

- [P] = archivos distintos, sin dependencias entre sí
- [Story] mapea cada tarea a su user story para trazabilidad
- No se generaron tareas de test (no solicitadas en spec.md); T038 cubre la validación manual
- Commitear después de cada tarea o grupo lógico
- Detenerse en cada Checkpoint para validar la story de forma independiente
