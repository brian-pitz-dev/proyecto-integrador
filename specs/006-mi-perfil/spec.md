# Feature Specification: Mi perfil y semana de entrenamiento

**Feature**: `006-mi-perfil` | **Created**: 2026-11-12 | **Status**: Implementado y validado en Playwright (migración aplicada 2026-11-12)

**Input**: "Hay que agregar un botón de mi perfil, con los datos de usuario, añadir más
objetivos o eventos y poder seleccionar días a la semana de entrenamiento o tiempo de
entrenamiento. Que estos últimos también apliquen a la creación de usuario y de allí se
arme el plan."

Cierra la US5 de `specs/004-multi-user-onboarding` (gestión de eventos después del registro).

## User Stories

### US1 — Mi perfil (P1)

Desde un botón en el header (ícono de usuario), el usuario abre `/perfil` y edita su
nombre, su fecha de nacimiento, su altura, su sexo, su peso, sus metas de peso y de grasa,
su nivel de actividad y su calibración. El email se muestra pero no se edita. Al guardar se
recalculan el plan y las calorías. `plan_start` no cambia.

### US2 — Eventos después del registro (P1)

En `/perfil` el usuario agrega, edita o elimina eventos (carreras y caminatas). Los eventos
pasados solo se pueden eliminar. Si no quedan eventos próximos, la página lo dice y el plan
queda en mantenimiento.

### US3 — Semana de entrenamiento (P1)

En el registro (paso Perfil) y en `/perfil`, el usuario elige **qué días** puede entrenar
(al menos 2) y **cuántos minutos** tiene por sesión (30, 45, 60 o 90). El plan pone las
sesiones solo en esos días:

- Si elige menos días que la plantilla, se priorizan las sesiones según el objetivo. Antes
  de un evento: salida larga > correr > gym > core. En mantenimiento y recuperación, gym y
  correr pesan igual.
- La salida larga cae en el último día elegido de la semana.
- Con 45 o 30 minutos, cada día queda con una sola sesión (la principal) y las rutinas se
  acortan a 4 o 3 ejercicios.
- Lunes a sábado con 60 minutos o más da exactamente el plan de siempre (y es el default
  de las cuentas existentes).

## Fuera de alcance

- Reescalar los textos de cardio (por ejemplo, "40 min de cinta") al tiempo disponible:
  con 30 minutos el texto sigue diciendo 40. Ver research.md, Decisión 3.
- Cambiar el email o la contraseña desde `/perfil`.
- Historial de disponibilidad: si cambia los días, también se reacomodan las semanas
  pasadas del calendario. Los registros y los tildes no se pierden, porque van por fecha.
