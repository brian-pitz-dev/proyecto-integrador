# Research: Mi perfil y semana de entrenamiento

## Decisión 1 — Días específicos, no cantidad

Se guarda `perfil.dias_entrenamiento smallint[]`, con 0 = lunes … 6 = domingo, el mismo
orden que `dowKeys` en `lib/training-plan.ts`. Con días específicos el calendario coincide
con la semana real del usuario. La alternativa ("N días por semana") obligaba a la app a
adivinar cuáles.

## Decisión 2 — Adaptar cada semana después de armarla (`adaptWeek`)

`buildPlan` sigue armando las fases con la plantilla de siempre y después pasa cada semana
por `adaptWeek(cfg, phaseKey, weekNum, disponibilidad)`:

1. **Selección.** Cada día de la plantilla con sesiones es un "slot" con la prioridad de su
   sesión más importante. Se quedan los N slots más prioritarios (N = días elegidos). A
   igual prioridad, el orden rota según el número de semana, para que con pocos días el gym
   no repita siempre la misma rutina (empuje → inferior → tirón).
2. **Ubicación.** Los slots elegidos se reparten en los días elegidos conservando el orden
   de la semana y minimizando el corrimiento total (programación dinámica de a lo sumo 7×7).
   Por eso la salida larga del sábado cae en el último día elegido, y si los días incluyen
   los de la plantilla, nada se mueve.
3. **Tiempo.** Con menos de 60 minutos, cada día conserva solo su sesión más prioritaria, y
   la rutina de gym o core lleva `maxEjercicios` (4 con 45 minutos, 3 con 30). Las rutinas
   ya listan primero los ejercicios compuestos, así que se cortan los finales.

Los descansos con texto propio (por ejemplo, la carga de carbohidratos) se conservan en su
día. El día del evento lo sigue resolviendo `eventOverrideFor` por fecha, sea o no día de
entrenamiento.

**Invariante:** lunes a sábado (o los 7 días) con 60 minutos o más devuelve la semana sin
tocar. El default de la columna es ese, así que las cuentas existentes (Brian incluido) no
ven cambios. Lo comprueba `lib/training-plan.test.ts` (antes `scripts/check-training-days.mjs`).

## Decisión 3 — El tiempo no reescribe los textos de cardio

Los detalles de cardio son texto libre de la metodología ("5.5 km/h · 40 min"). Reescalarlos
exigiría parsear y reescribir cada string. Se aceptó que con 30 minutos el usuario haga la
versión que le entre. Para mejorarlo, habría que pasar las duraciones de cardio a datos
estructurados en `phaseNWeek`.

## Decisión 4 — `updated_at` en `perfil` y `evento`

El Coach marca como desactualizadas las rutinas y comidas de la IA si el perfil o los
eventos cambiaron después de generarlas. Antes comparaba contra `created_at`, porque no se
podía editar nada. Ahora se compara contra `updated_at`; las filas existentes lo inicializan
con su `created_at`. Borrar un evento no deja rastro y no dispara el aviso (queda como
`shortcut:` en `app/(app)/coach/page.tsx`).

## Decisión 5 — Las semanas del plan arrancan el lunes

Hasta ahora `buildPlan` arrancaba la semana 1 en `plan_start`, el día del registro. Si ese
día no era lunes, la clave `mon` de la plantilla caía otro día, aunque el calendario la
mostraba como "Lun" (por ejemplo, un registro de jueves 12 mostraba "Lun 12"). Con días
elegidos por el usuario el error se volvía visible: el "martes" caía viernes. Ahora la
semana 1 arranca el lunes de la semana de `plan_start`. La cuenta de Brian arranca un lunes
(2026-08-17), así que no cambia. Lo comprueba `lib/training-plan.test.ts` ("arranca un jueves").
