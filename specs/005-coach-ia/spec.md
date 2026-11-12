# Feature Specification: Coach IA

**Feature**: `005-coach-ia` | **Created**: 2026-11-12 | **Status**: Implementado (falta probar con `GEMINI_API_KEY` real)

**Input**: "Quiero agregar una IA para armar planes de comida y de ejercicios y que sea un
acompañante para la app. Tiene que ser gratis, sin cargos extras, y de uso limitado por
usuario." Después se sumó: sacar la pestaña Mancuernas, dejar que el usuario cargue
ingredientes o comidas que tiene o quiere para sumarlos a su plan, escalar las porciones
a la meta calórica y ajustar el umbral de proteína según el peso.

## User Stories

### US1 — Chat acompañante (P1)

Un usuario con el onboarding completo abre **Coach** y le pregunta sobre su plan. Las
respuestas usan su perfil, sus metas, sus eventos, la fase actual, las sesiones de la
semana y sus registros de los últimos 14 días. El historial no se guarda: vive en el
navegador.

### US2 — Plan de comidas con IA (P1)

El usuario escribe qué ingredientes o comidas tiene o quiere comer y elige una de dos
opciones:

- **Agregar al plan**: la IA convierte el texto en platos que se **suman** a su banco.
  Entran a la rotación normal, así que no aparecen sí o sí esta misma semana.
- **Armar plan nuevo**: la IA reemplaza el banco completo.

"Volver al plan base" restaura el banco compartido.

### US3 — Rutinas de gym con IA (P2)

El usuario elige las zonas que quiere priorizar y escribe el equipo que tiene. La IA arma
las 7 rutinas (`gymKey`) a partir de sus eventos y metas. El plan sigue decidiendo qué
rutina toca cada día según la fase.

### US4 — Porciones a la meta y proteína por peso (P1)

En Nutrición, las porciones de lunes a viernes se escalan para acercarse a la meta
calórica del día, con un factor de 0.75 a 1.3. El umbral de proteína del almuerzo, que
dispara el refuerzo, escala con el peso actual. Sin peso registrado, el comportamiento
es idéntico al anterior.

## Requirements

- **FR-001**: Costo $0. Se usa la API key de un proyecto de Google Cloud **sin
  facturación** (tier gratis de AI Studio), así que nunca puede haber cargos.
- **FR-002**: Máximo 20 usos de IA por usuario por día (fecha de Buenos Aires), además
  de 5 por minuto. El límite diario no se puede saltear desde el navegador.
- **FR-003**: Solo se descuenta un uso cuando la IA respondió bien.
- **FR-004**: La salida de la IA se valida con zod antes de guardarla y otra vez al
  leerla.
- **FR-005**: No se manda a la IA ni el email ni el nombre del usuario. La UI avisa que
  Google procesa los mensajes.
- **FR-006**: Sin `GEMINI_API_KEY`, la app funciona normal y Coach muestra "IA no
  configurada".
- **FR-007**: Se elimina la pestaña Mancuernas y su lugar en la nav lo ocupa Coach.
