# Quickstart: validar semana de retome y fin de eventos

1. `npm test` → pasa "semana de retome" en `lib/training-plan.test.ts`.
2. Con una cuenta que tenga al menos una semana completa de plan y que la semana pasada haya
   tildado menos de la mitad de los días: el Calendario muestra "Semana de retome" y las
   sesiones de esta semana son más cortas que las de la que viene.
3. Tildar en el Calendario los días que faltaban de la semana pasada (hasta la mitad o más):
   al recargar, el aviso desaparece y la semana vuelve a la normalidad.
4. Una cuenta nueva (primera semana) nunca tiene retome.
5. Sin eventos por delante: arriba del Calendario aparece "¡Terminaste tus eventos!" con el
   botón a Mi perfil. Al cargar uno nuevo, desaparece.

Para ver los casos 2 y 5 sin esperar una semana, se puede forzar un momento en local:
`semanaDeRetome(...) ?? { start: "<lunes de esta semana>", hechos: 0, entrenables: 3 }` en
`lib/user-plan.ts`, o pasar eventos con fecha pasada a `<EventosResumen>`. Así se validó el
2026-11-13 (y se volvió atrás).
