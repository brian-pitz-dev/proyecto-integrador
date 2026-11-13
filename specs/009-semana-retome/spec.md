# Feature Specification: Semana de retome y fin de los eventos

**Feature**: `009-semana-retome` | **Created**: 2026-11-13 | **Status**: Implementado; validado con tests y en Playwright (forzando el caso, ver quickstart)

**Input**: "Que el plan se adapte si te salteás sesiones" (la opción elegida fue "semana de
retome") y "¿Y después del evento?".

## US1 — Semana de retome (P1)

Si la semana pasada el usuario entrenó menos de la mitad de sus días entrenables, la semana en
curso va más liviana para volver de a poco, y el Calendario lo avisa ("Semana de retome: la
semana pasada entrenaste 1 de 4 días…").

- **Qué cambia**: la semana se arma con un escalón menos de minutos por sesión (90 o 60 → 45,
  45 → 30, 30 → 20), con la misma adaptación de spec 006: una sesión principal por día, rutinas
  más cortas (con 20', de 2 ejercicios) y cardio con menos minutos. Los días no cambian, así que
  los conteos de Estadísticas tampoco.
- **Cuándo no**: si la semana pasada tenía menos de 2 días entrenables (ej. la primera del
  plan), si fue semana de evento, o si la de ahora es de evento, previa a un evento,
  recuperación (p3) o taper (p5): ya tienen su propia carga.
- **Sin datos nuevos**: se calcula en cada pedido con los días marcados como hechos
  (`registro` "completado"). Si el usuario tilda tarde los días de la semana pasada, el retome
  desaparece. Lo decide `semanaDeRetome()` y lo aplica `buildPlan(…, retome)`, desde
  `getUserPlanContext()`, así Calendario, Nutrición, Coach y Estadísticas ven el mismo plan.

## US2 — Después del último evento (P2)

Cuando no queda ningún evento por delante (o no hay ninguno), el Calendario muestra
"¡Terminaste tus eventos!" (o "No tenés eventos cargados") con un botón a `/perfil` para cargar
el próximo. Hasta entonces el plan sigue en mantenimiento, como antes.

## Fuera de alcance

- Mover a otro día una sesión salteada, o proponer cambios para que el usuario los acepte
  (se evaluaron y se eligió el retome).
- Achicar la salida larga en el retome: sigue siendo la sesión que no se recorta.
