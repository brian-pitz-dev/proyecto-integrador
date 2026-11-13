# Phase 1 Data Model: Migración a Next.js con Diseño Renovado

Este documento describe el modelo de datos **existente** en Supabase, tal como se
relevó del HTML actual. Por el Principio IV de la constitución, ninguna estructura
descrita acá se modifica en esta etapa — el código nuevo se adapta a esto, no al
revés.

## Entidad: `registro`

Única tabla usada por la aplicación. Cada fila es un evento cargado por el usuario.

| Columna     | Tipo (inferido)                                         | Descripción                                                                                                        |
| ----------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `id`        | identificador único (usado en `.delete().eq("id", id)`) | Clave primaria del registro.                                                                                       |
| `categoria` | texto                                                   | Discrimina el tipo de evento. Valores usados hoy: `tirada`, `caminata`, `calorias`, `peso`, `sueno`, `completado`. |
| `fecha`     | fecha (ISO `YYYY-MM-DD`)                                | Fecha a la que corresponde el registro.                                                                            |
| `valor`     | numérico                                                | Magnitud del registro (km, calorías, kg, horas, o `1` para `completado`).                                          |
| `nota`      | texto, opcional                                         | Texto libre asociado. Usado hoy solo por `tirada` para guardar tiempo y ritmo (`"1:15:30 · 5:30/km"`).             |

### Valores de `categoria` y su significado

| `categoria`  | Origen (User Story) | `valor` representa       | `nota`                    |
| ------------ | ------------------- | ------------------------ | ------------------------- |
| `tirada`     | US1 (running)       | distancia en km          | `"{tiempo} · {ritmo}/km"` |
| `caminata`   | US1 (caminata)      | distancia en km          | —                         |
| `calorias`   | US1 (dieta)         | calorías del día         | —                         |
| `peso`       | US1 (dieta)         | peso corporal            | —                         |
| `sueno`      | US1 (dieta)         | horas de sueño (decimal) | —                         |
| `completado` | US2 (calendario)    | siempre `1`              | —                         |
| `foto`       | spec 007 (notas)    | siempre `0`              | nota de la foto del día   |
| `grasa`      | spec 007 (fotos)    | % de grasa corporal      | —                         |

### Reglas de validación (heredadas del comportamiento actual, no del schema)

- `fecha` no puede ser una fecha futura para `completado` (edge case documentado en
  la spec).
- Todo insert requiere `categoria`, `fecha` y `valor`; `nota` es opcional.
- No hay unicidad impuesta por el schema: cargar dos registros de la misma
  `categoria`/`fecha` es válido hoy (ej. corregir un valor cargando uno nuevo en vez
  de editar) y se preserva ese comportamiento.

### Entidades derivadas (no persistidas, calculadas en la app)

Estas no son tablas — son datos calculados en memoria a partir de `registro` y de un
plan de entrenamiento semanal fijo en el código (igual que en la app actual):

- **Sesión programada**: día + `tag` (ej. `"gym"`) definido por el plan semanal
  hardcodeado, no por Supabase. Se cruza contra `registro` (`categoria: "completado"`)
  para calcular rachas y pintar el calendario.
- **Objetivo calórico**: calculado con la fórmula Mifflin-St Jeor a partir del
  último `registro` con `categoria: "peso"`, más una fase (bulk/déficit) definida en
  el código, igual que `getCalorieTarget()`/`mifflin()` en la app actual.

## Relaciones

No hay relaciones entre tablas — es una única tabla plana. La "relación" entre tipos
de datos (ej. gym programado vs. gym completado) se resuelve en código de aplicación
cruzando el plan semanal (estático) contra filas de `registro`.
