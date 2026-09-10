# Research: Rediseño de Frontend (002-frontend-redesign)

## Decisión 1 — Mapeo de las 3 etiquetas del menú lateral a las rutas (revisada)

**Decision**: El menú lateral usa las 3 etiquetas pedidas por el usuario, mapeadas a rutas reales — dos ya existentes y una nueva página de contenido estático:

| Label del menú   | Ruta                     | Justificación                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan de gimnasio | `/calendario`            | `lib/training-plan.ts` ya modela el plan semanal con tags `gym`/`run`/`core`/`long`, y Calendario es donde ese plan se visualiza.                                                                                                                                                                                                                                                                                                       |
| Nutrición        | `/nutricion` (**nueva**) | La app previa a la migración (`plan_vida_2026.html`) tenía una página `page-nutri` dedicada con el plan de comidas por día (banco de comidas, rotación semanal, reglas fijas). Esa página nunca se migró en 001-nextjs-migration ni quedó documentada como decisión de scope — es un gap de esa etapa, no una elección de diseño. El usuario confirmó portarla ahora como parte de 002 (ver spec.md, User Story 5, FR-015/016/017/018). |
| Stats            | `/estadisticas`          | Coincidencia directa.                                                                                                                                                                                                                                                                                                                                                                                                                   |

**Rationale**: La primera versión de esta decisión (Nutrición→`/registro`, ver historial de esta sesión) asumía que no se podían agregar páginas nuevas. Al revisar `plan_vida_2026.html` para responder una pregunta del usuario sobre "dónde quedan las comidas por día", se confirmó que "Nutrición" siempre se refirió a una página propia, no a un alias de Registro. El usuario pidió agregarla al spec 002 en vez de diferirla a una etapa aparte.

**Alternatives considered**:

- Mapear Nutrición a `/registro` (decisión original de esta sesión) — descartada tras encontrar `page-nutri` en el HTML legado: describía mal el contenido y ocultaba una feature real que el usuario esperaba recuperar.
- Diferir el plan de comidas a una etapa 003 separada — el usuario prefirió incorporarlo ahora al spec 002.
- Modelar el plan de comidas en Supabase (tabla nueva) — rechazado: el patrón ya establecido para contenido de plan fijo es `lib/training-plan.ts` (constante en código, no dato de Supabase, según su propio comentario "Principio IV"); replicar ese patrón evita disparar el requisito de aprobación explícita de cambio de esquema.

## Decisión 2 — Estructura del modal de carga de datos

**Decision**: Un botón/card de acceso rápido por categoría (tirada, caminata, calorías, peso, sueño) que abre su propio modal ya enfocado en ese dato (pide únicamente valor + fecha + hora, sin selector de tipo). Los 5 `components/log-form/*.tsx` existentes migran su contenido a `<Dialog>` (ya instalado en `components/ui/dialog.tsx`), no se reemplazan por un formulario unificado.

**Rationale**: Confirmado por el usuario ("Un modal por categoría (Recomendado)"). Aplica Ley de Hick reduciendo las opciones visibles _dentro_ de cada modal (nada de selector de categoría) y es el cambio de menor diff sobre los 5 componentes de formulario ya existentes — cada uno ya sabe qué campo pide.

**Alternatives considered**:

- Modal único con selector de categoría — descartado por el usuario; agrega un paso extra dentro del modal.

## Decisión 3 — Modo oscuro y tokens de color

**Decision**: Reutilizar el sistema de tokens de shadcn (`app/globals.css`, formato `oklch`, ya con bloque `.dark` completo) definido por `components.json` (`style: base-nova`, `cssVariables: true`) y `next-themes` (ya en `package.json`), en vez de introducir un sistema de theming paralelo. Se reemplazan los valores de `--primary`/`--accent`/`--ring`/`--chart-*`/`--sidebar-*` (hoy verde-azulado, hue ~165) por la paleta complementaria nueva definida por `ui-ux-pro-max --design-system`, manteniendo la misma estructura de variables.

**Rationale**: `next-themes` y los tokens `.dark` ya existen y están cableados a Tailwind vía `@theme inline` en `globals.css`; sólo falta (a) activar el toggle de tema si no está montado en `layout.tsx`, y (b) reemplazar los valores de paleta. No hay necesidad de una librería de theming nueva (Principio III: todo pasa por `ui-ux-pro-max`, no un sistema paralelo).

**Alternatives considered**: CSS-in-JS o un contexto de tema custom — rechazado, `next-themes` + CSS variables ya cubre esto y es el patrón estándar de shadcn.

## Decisión 4 — Tipografía

**Decision**: Agregar `JetBrains_Mono` vía `next/font/google` (ya se usa el patrón `next/font/google` para `Plus_Jakarta_Sans` en `app/layout.tsx`) como variable de fuente adicional, mapeada a `--font-mono` (que hoy apunta a `--font-geist-mono`, no cargada realmente — variable huérfana) o a `--font-sans` según defina el sistema de diseño de `ui-ux-pro-max`. No se agrega una dependencia de fuente nueva fuera de `next/font/google`.

**Rationale**: `next/font/google` ya es el mecanismo usado en el proyecto; `JetBrains_Mono` está disponible ahí. `globals.css` ya referencia `--font-mono: var(--font-geist-mono)` sin que esa variable esté definida en ningún lado — es momento de resolver esa referencia húerfana con la fuente real que se cargue.

**Alternatives considered**: Self-hosted font files — rechazado, `next/font/google` ya resuelve auto-hosting/optimización sin dependencias nuevas.

## Decisión 5 — Menú lateral desplegable (sidebar) y equivalente mobile

**Decision**: Construir el sidebar con los primitivos ya disponibles (`@base-ui/react` + los tokens `--sidebar-*` ya presentes en `globals.css`, hoy sin usar) en vez de instalar una librería de sidebar nueva. En mobile, el mismo componente colapsa a un drawer/off-canvas (mismo patrón: overlay + slide-in), no una barra inferior separada — reemplaza la barra de navegación inferior fija actual (`app/layout.tsx` líneas 49-60) para no tener dos patrones de navegación distintos (Ley de Jakob: un solo patrón de navegación consistente entre plataformas).

**Rationale**: Los tokens `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` ya están definidos en `globals.css` (claro y oscuro) pero ningún componente los consume hoy — indican que el sistema de diseño ya fue preparado para un sidebar. `@base-ui/react` (ya instalado) provee primitivos sin estilo (dialog/popover-like) suficientes para un drawer accesible.

**Alternatives considered**: Mantener bottom nav en mobile y agregar sidebar solo en desktop — rechazado, el usuario pidió "equivalente en mobile" del mismo menú (Ley de Jakob), no dos patrones de navegación distintos.

## Decisión 6 — Portado del plan de comidas (`lib/meal-plan.ts`)

**Decision**: Portar 1:1 el `mealBank` y la lógica de rotación de `plan_vida_2026.html` (líneas ~2534 en adelante: grupos `desayuno`/`media`/`almuerzo`/`merienda`/`cena`, cada opción con `name`/`detail`/`ingredientes`, más `buildRecencySequence` y `pickAlmuerzo`/`pickCena` para la rotación sin repetir, y `applyProteinReinforcement` para el ajuste de proteína) a un nuevo módulo `lib/meal-plan.ts`, siguiendo el mismo patrón que `lib/training-plan.ts` (constante en código, comentario explícito de que no es dato de Supabase).

**Rationale**: Es exactamente el mismo patrón que ya se usó para portar el plan de gimnasio en 001; reutilizar esa estructura evita reinventar el enfoque y mantiene ambos "planes fijos" (gimnasio y comidas) consistentes entre sí en cómo se modelan.

**Alternatives considered**: Reescribir la lógica de rotación desde cero con un enfoque distinto — rechazado, el algoritmo original ya resuelve el requisito (no repetir plato en turnos consecutivos, refuerzo de proteína) y portarlo 1:1 es el diff más chico.

## Decisión 7 — Selector de semanas agrupado por mes + marca de eventos

**Decision**: Exportar la estructura interna de semanas de `lib/training-plan.ts` (hoy calculada en un array `weeks` no exportado, con `num`, `start`, `phase`) mediante una función `getWeeks()` (o similar) que además indique, por semana, si coincide con un evento (`EV_10K`/`EV_LUJAN`/`EV_21K`) o es su semana de preparación previa. Construir un componente compartido `WeekSelector` (mes → semanas de ese mes) consumido tanto por `/calendario` como por `/nutricion`, ya que ambas páginas necesitan la misma agrupación y las mismas fechas de plan (`PLAN_START`/`PLAN_END`, ago–dic 2026).

**Rationale**: Confirmado por el usuario (agrupar por mes + semanas del mes, Recomendado). Los datos de fase/evento ya existen en `lib/training-plan.ts` — sólo faltaba exponerlos; construir un solo componente reutilizable evita duplicar la lógica de agrupación por mes entre Calendario y Nutrición.

**Alternatives considered**:

- Dropdown único con las ~20 semanas sin agrupar — descartado por el usuario a favor de la agrupación por mes.
- Mantener solo "semana anterior/siguiente" sin salto directo — descartado por el usuario; pierde la posibilidad de ir directo a, por ejemplo, la semana de un evento.
- Duplicar la lógica de selector en cada página en vez de un componente compartido — rechazado, mismo patrón de datos (semana → mes → fase/evento) en ambas páginas, duplicarlo violaría el rung 2 de la escalera de simplicidad (reusar lo que ya existe en el codebase).

## Decisión 8 — Rotación de comidas: determinística y fija, sin regenerar

**Decision**: Portar el algoritmo de rotación de `plan_vida_2026.html` (`mulberry32` con semillas fijas 42/99, `buildRecencySequence` con tope duro `MAX_SLOTS_SIN_SALIR = 10`) tal cual, sin agregar una función de "regenerar" el plan. Al ser 100% determinístico (mismo `weekNum`/`dayIdx` → mismo resultado, siempre), ninguna semana —ni la actual ni las futuras— cambia con el paso del tiempo una vez calculada. Esto ya satisface "la semana actual queda fija" sin necesidad de un mecanismo de lock explícito.

**Rationale**: Confirmado por el usuario (portar el algoritmo tal cual, Recomendado) tras explicarle que el algoritmo original ya es estático para siempre, no sólo para la semana en curso. Evita construir un mecanismo nuevo (regenerar + lock de semana actual) que no existía en la versión anterior y que el usuario no terminó pidiendo una vez aclarada la diferencia.

**Alternatives considered**: Agregar un botón/mecanismo de regenerar el menú de semanas futuras con lock de la semana en curso — descartado por el usuario; es una feature nueva sin precedente en la app vieja, fuera del alcance de "portar" lo que ya existía.

## Decisión 9 — Testing

**Decision**: No se introduce un framework de testing nuevo (no hay `vitest`/`jest` en el repo). La validación de esta feature es manual, guiada por `quickstart.md` (visual/UX, no puede automatizarse significativamente sin herramientas de testing visual que el proyecto no tiene).

**Rationale**: Consistente con el estado actual del repo (sin suite de tests) y con el alcance de la feature (visual/UX, no lógica de negocio nueva). Ninguna constitución del proyecto exige tests para cambios de estilo/UI.

## Resumen de Technical Context

- **Language/Version**: TypeScript 5 (strict), React 19.2, Next.js 16.3.3 (App Router)
- **Primary Dependencies**: Tailwind CSS 4 + shadcn (`style: base-nova`), `@base-ui/react`, `next-themes`, `lucide-react`, `sonner`, `tw-animate-css`, `class-variance-authority`, `clsx`/`tailwind-merge` — todas ya instaladas
- **Storage**: Supabase (sin cambios de esquema — Principio IV)
- **Testing**: Manual, vía `quickstart.md` (sin framework de test en el repo)
- **Target Platform**: Web responsive (360px–1920px), Next.js SSR/RSC
- **Project Type**: Web app single-project (Next.js App Router, sin split frontend/backend)
- **Performance Goals**: Animaciones perceptibles en <300ms (SC-003 del spec)
- **Constraints**: Sin scroll horizontal 360px–1920px (SC-004 heredado de 001, FR-010); respetar `prefers-reduced-motion` (FR-005, SC-005)
- **Scale/Scope**: 5 páginas de contenido (inicio, registro, calendario, estadísticas, nutrición — nueva) + selector de semanas compartido (Calendario/Nutrición, ago–dic 2026) + 404 + sitemap.xml; un solo usuario final
