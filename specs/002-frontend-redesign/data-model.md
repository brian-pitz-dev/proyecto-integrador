# Data Model: Rediseño de Frontend (002-frontend-redesign)

Esta feature es mayormente visual/UX y no toca el esquema de Supabase (Principio IV). La única entidad de contenido nueva es el plan de comidas (US5), que se modela como dato estático en código — igual que el plan de gimnasio ya existente — sin agregar tablas ni columnas.

## Design Tokens (CSS variables, `app/globals.css`)

| Token                                                                                                              | Descripción                                                 | Cambia en esta etapa                                |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | --------------------------------------------------- |
| `--background`, `--foreground`                                                                                     | Fondo/texto base                                            | Sí (paleta nueva, modo oscuro por defecto)          |
| `--primary`, `--primary-foreground`                                                                                | Color de acento principal                                   | Sí (reemplaza el verde-azulado, hue ~165)           |
| `--accent`, `--accent-foreground`                                                                                  | Acento secundario                                           | Sí                                                  |
| `--secondary`, `--muted`, `--destructive`                                                                          | Estados neutro/atenuado/error                               | Sí, dentro de la paleta complementaria              |
| `--border`, `--input`, `--ring`                                                                                    | Bordes y foco                                               | Sí                                                  |
| `--chart-1`..`--chart-5`                                                                                           | Serie de colores para gráficos de Estadísticas              | Sí                                                  |
| `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` | Tokens del menú lateral nuevo                               | Sí (hoy definidos pero sin consumidor)              |
| `--font-sans`                                                                                                      | Fuente principal (`Plus_Jakarta_Sans`, ya cargada)          | No                                                  |
| `--font-mono`                                                                                                      | Fuente monoespaciada — hoy apunta a una variable no cargada | Sí (pasa a `JetBrains_Mono` vía `next/font/google`) |
| `--radius` y derivados                                                                                             | Radios de borde                                             | No (se mantiene el estilo `base-nova`)              |

Reglas de validación: todo color nuevo se define como token en `:root`/`.dark`, ningún componente usa un color hardcodeado fuera de estos tokens (ver FR-001/FR-002 del spec).

## Entidades de estado de UI (client-side, sin persistencia)

- **Sección de navegación activa**: cuál de las 3 rutas (`/calendario` "Plan de gimnasio", `/registro` "Nutrición", `/estadisticas` "Stats") está activa; deriva de la ruta actual (`usePathname`), no se persiste.
- **Estado del sidebar (abierto/cerrado)**: booleano de UI, colapsado por defecto en mobile (drawer), expandido en desktop; puede persistirse en `localStorage` por preferencia de continuidad visual entre sesiones (no es dato de negocio).
- **Modal de carga de dato**: uno por categoría (`tirada`, `caminata`, `calorias`, `peso`, `sueno`), con estado abierto/cerrado + los campos ya definidos por cada `*-form.tsx` existente (valor, fecha, hora, nota). No cambia la forma del dato enviado a Supabase (`lib/types.ts` → `Registro`), sólo dónde vive el formulario (dentro de un `<Dialog>` en vez de siempre visible).
- **Tema (claro/oscuro)**: gestionado por `next-themes`, persistido en `localStorage` por la librería (comportamiento estándar, no requiere modelado adicional).

No hay transiciones de estado de negocio nuevas ni entidades persistidas nuevas en esta etapa.

## Plan de comidas (`lib/meal-plan.ts`, contenido estático)

Portado 1:1 desde `plan_vida_2026.html` (mismo patrón que `lib/training-plan.ts`). No es dato de Supabase — Principio IV no se activa, no requiere aprobación de cambio de esquema.

| Campo          | Tipo                                                          | Descripción                                                                        |
| -------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `tipo`         | `"desayuno" \| "media" \| "almuerzo" \| "merienda" \| "cena"` | Grupo de comida del día                                                            |
| `name`         | `string`                                                      | Nombre corto de la opción (ej. "Pollo + arroz + espinaca")                         |
| `detail`       | `string`                                                      | Detalle de porciones/preparación                                                   |
| `ingredientes` | `{ id: string; cantidad: number \| null }[]`                  | Ingredientes con cantidad en gramos (o `null` si no aplica, ej. batidos por scoop) |

**Rotación**: función determinística (portada de `buildRecencySequence` / `pickAlmuerzo` / `pickCena`) que, dado el número de semana y el día, selecciona una opción del banco sin repetir dentro del ciclo de rotación, y evita que cena y merienda del mismo día coincidan.

**Reglas fijas** (texto estático, no requiere modelado): plato chico para desayuno/merienda, plato playo de 28cm con medio plato de vegetales para almuerzo/cena, vaso de agua antes de cada comida, creatina diaria, sábado/domingo sin estructura fija salvo evento.

**Refuerzo de proteína**: función determinística (`applyProteinReinforcement`) que, si el almuerzo de un día queda bajo en proteína, agranda el desayuno o agrega batido en merienda/cena — portada igual, sin cambios de regla.

## Semana del plan (extensión de `lib/training-plan.ts`)

Estructura ya calculada internamente por `training-plan.ts` (array `weeks`), hoy no exportada. Se expone vía una función tipo `getWeeks()` para que el `WeekSelector` compartido (Calendario y Nutrición) la consuma.

| Campo         | Tipo                        | Descripción                                                              |
| ------------- | --------------------------- | ------------------------------------------------------------------------ |
| `num`         | `number`                    | Número de semana dentro del plan (1..N)                                  |
| `start`       | `Date`                      | Lunes de inicio de esa semana                                            |
| `phase`       | referencia a `PhaseDef`     | Fase de entrenamiento a la que pertenece (ya existe)                     |
| `isEventWeek` | `boolean` (nuevo, derivado) | `true` si la semana contiene la fecha de `EV_10K`, `EV_LUJAN` o `EV_21K` |
| `isPrepWeek`  | `boolean` (nuevo, derivado) | `true` si es la semana inmediatamente anterior a una semana de evento    |

Rango válido: `PLAN_START` (2026-08-17) a `PLAN_END` (2026-12-31), ya definidos en `training-plan.ts`. No es dato de Supabase; se deriva 100% de constantes ya existentes en el código.
