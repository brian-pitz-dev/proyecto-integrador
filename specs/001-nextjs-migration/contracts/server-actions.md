# Contratos: Server Actions

Esta app no expone una API pública externa; su única interfaz son los Server
Actions de Next.js que los formularios de UI invocan. Cada uno mapea 1:1 a una
función equivalente del HTML actual (misma tabla `registro`, mismo `categoria`).

## `saveLog`

Equivalente a `saveLog(categoria, fecha, valor, nota)` de la app actual.

- **Input**: `{ categoria: "tirada" | "caminata" | "calorias" | "peso" | "sueno" | "completado", fecha: string (YYYY-MM-DD), valor: number, nota?: string }`
- **Efecto**: `insert` en `registro`.
- **Output éxito**: `{ ok: true }`
- **Output error**: `{ ok: false, message: string }` (nunca lanza una excepción sin
  manejar hacia el formulario — igual que el `try/catch` + `alert` actual, pero como
  mensaje de UI en vez de `alert()`).
- **Post-condición**: revalida las rutas de calendario y estadísticas.

## `deleteLog`

Equivalente a `deleteLog(id)`.

- **Input**: `{ id: string | number }`
- **Efecto**: `delete` en `registro` donde `id` coincide.
- **Output**: igual forma que `saveLog`.
- **Post-condición**: revalida las rutas de calendario y estadísticas.

## `toggleDayDone`

Equivalente a `toggleDayDone(fecha, isDone)`.

- **Input**: `{ fecha: string (YYYY-MM-DD), isDone: boolean }`
- **Efecto**: `isDone === true` → insert `{ categoria: "completado", fecha, valor: 1 }`;
  `isDone === false` → delete donde `categoria = "completado" AND fecha = fecha`.
- **Output**: igual forma que `saveLog`.
- **Post-condición**: revalida la vista de calendario y estadísticas (racha de gym).

## Lecturas (Server Components, no Server Actions)

No son "contratos" en el sentido de mutación, pero documentan qué consulta hace
cada vista al montarse:

- **Calendario**: `select fecha from registro where categoria = 'completado'`
  (equivalente a `getCompletedDates()`).
- **Estadísticas / listados por tipo**: `select * from registro where categoria = :categoria order by fecha desc limit :n`
  (equivalente a `fetchLogs()`), una consulta por tipo de registro mostrado.

## Fuera de alcance de esta etapa

No hay autenticación ni autorización en ninguno de estos contratos (ver
Clarifications en `spec.md`): cualquier invocación con la anon key configurada
puede ejecutar cualquiera de estas acciones, igual que en la app actual.
