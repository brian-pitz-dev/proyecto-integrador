# Quickstart: Validación de la migración a Next.js

## Prerrequisitos

- Node.js LTS instalado.
- Variables de entorno con el mismo proyecto de Supabase que usa `plan_vida_2026.html`
  hoy (mismo `SUPABASE_URL` / anon key, ver `research.md` §3): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Acceso de lectura al proyecto Supabase existente para verificar que los datos
  históricos aparecen sin cambios (Principio IV: no se toca el schema).

## Setup

```bash
npm install
npm run dev
```

## Escenarios de validación (uno por User Story de spec.md)

### US1 — Registrar actividad y salud sin perder datos históricos

1. Abrir la app reconstruida y cargar una tirada de running (km + tiempo).
   **Esperado**: aparece en el listado con el ritmo (pace) calculado, igual formato
   que `plan_vida_2026.html`.
2. Cargar caminata, calorías, peso y sueño (uno de cada uno).
   **Esperado**: cada uno se guarda como una fila en `registro` con la `categoria`
   correspondiente (ver `data-model.md`).
3. Abrir el proyecto de Supabase (o comparar contra `plan_vida_2026.html` abierto en
   paralelo) y confirmar que los registros cargados **antes** de esta migración
   siguen listados sin pérdida ni duplicación.
4. Borrar uno de los registros cargados en el paso 1-2.
   **Esperado**: desaparece de inmediato del listado, calendario y estadísticas.
5. Consultar el objetivo calórico tras cargar un peso nuevo.
   **Esperado**: coincide con el que calcula `plan_vida_2026.html` para el mismo peso
   y fecha (misma fórmula Mifflin-St Jeor, ver `research.md` §6 / `data-model.md`).

### US2 — Calendario, rachas y alertas

1. Marcar un día programado como "gym" en el calendario como completado.
   **Esperado**: se pinta como completado al instante.
2. Simular (cargando o dejando de cargar) 3+ sesiones de gym seguidas sin marcar.
   **Esperado**: aparece la alerta de racha de gimnasio perdida en estadísticas.
3. Cargar dos tiradas de sábado consecutivas con ritmo igual o peor al objetivo.
   **Esperado**: aparece la alerta de ritmo de running no mejorado.

### US3 — Diseño visual renovado

1. Recorrer las tres secciones (registro, calendario, estadísticas) en escritorio y
   en un viewport de celular (360px de ancho).
   **Esperado**: sin scroll horizontal, sin elementos cortados, todas las acciones
   presentes en `plan_vida_2026.html` siguen disponibles (SC-004, FR-012).

## Criterio de éxito de esta etapa

Todos los escenarios anteriores pasan **y** el schema de Supabase (columnas, tipos,
políticas) es idéntico al que tenía antes de esta migración — verificable
comparando contra `data-model.md`, que documenta el estado tal como se relevó.
