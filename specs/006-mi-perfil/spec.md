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

## Agregado después (2026-11-13)

Lo que la primera versión dejó fuera de alcance:

- **Cardio según el tiempo disponible**: con menos de 60 minutos, los minutos del texto de
  cardio se achican para que entren ("40 min" pasa a "30 min"). Ver research.md, Decisión 3.
- **Email y contraseña desde `/perfil`** (tarjeta "Tu cuenta"): los dos piden la contraseña
  actual. El email cambia cuando se confirma el link que manda Supabase (vuelve por
  `/auth/confirm?type=email_change`). Al cambiar la contraseña se cierran las otras sesiones.
  Los formularios van en dos pasos: primero solo la contraseña actual (`confirmarClave`) y,
  si es correcta, se habilita el resto. El servidor la vuelve a verificar al guardar.
- **Descargar datos y borrar la cuenta piden la contraseña**, en un popup. La descarga pasó a
  POST (`/perfil/exportar`) para que la contraseña viaje en el body. Borrar usa los dos pasos.
- **Descansos con nombre**: al adaptar la semana a menos días, los descansos con texto propio
  (pre-carrera, piernas frescas, carga de carbohidratos) no se usan para entrenar.
- **Historial de disponibilidad**: si el usuario cambia sus días o minutos, las semanas que ya
  empezaron conservan la disponibilidad de antes. Ver research.md, Decisión 6.

## Fuera de alcance

- Las sesiones de series medidas en km ("5×1 km a 6:00/km") no se reescalan: se achican solo
  los minutos del texto.
