# Feature Specification: Fotos de progreso

**Feature**: `007-fotos-progreso` | **Created**: 2026-11-13 | **Status**: Implementado, migración aplicada 2026-11-13; validado en Playwright salvo exportar y borrar la cuenta con fotos (quickstart 8 y 9)

**Input**: Fase D del roadmap de spec 004 (`~/.claude/plans/enumerated-humming-iverson.md` §9):
"Fotos de progreso en Estadísticas".

## User Stories

### US1 — Subir una foto de progreso (P1)

En Estadísticas, sección "Fotos de progreso", el usuario elige una foto (de la galería o la
cámara) y la fecha (por defecto hoy, nunca una fecha futura) y la sube. Hay como máximo una
foto por día: subir otra el mismo día reemplaza la anterior.

### US2 — Ver la evolución (P1)

Las fotos se muestran como una línea de tiempo, de la más vieja a la más nueva, cada una con
su fecha. Tocar una la abre en tamaño completo. Solo el dueño puede verlas.

### US3 — Borrar una foto (P1)

Cada foto tiene un botón para borrarla, con un popup de confirmación.

### US4 — Las fotos entran en los derechos de la cuenta (P1)

- "Descargar mis datos" incluye las fotos, como links firmados que vencen a los 7 días.
- "Borrar mi cuenta" borra también las fotos. Si no se pueden borrar, la cuenta no se borra
  y se muestra un error, así no quedan archivos huérfanos.
- `/privacidad` dice que guardamos fotos y dónde.

## Requisitos

- Formatos: cualquier imagen que el navegador pueda abrir (JPG, PNG, WebP; HEIC solo donde el
  navegador lo decodifica). El navegador la achica a 1600 px de lado mayor y la convierte a
  JPEG antes de subirla. Así pesa menos y se le borran los metadatos, incluida la ubicación
  GPS.
- El servidor no confía en el cliente: verifica la sesión, la fecha, el tamaño (≤ 1,5 MB) y que
  el archivo sea un JPEG (por sus primeros bytes, no por el nombre).
- Hasta 100 fotos por cuenta (el plan gratis de Supabase Storage tiene 1 GB para todos).
- El bucket es privado: las fotos se sirven con URLs firmadas que vencen en 1 hora.

## Fuera de alcance

- Notas o etiquetas por foto, y comparar dos fotos lado a lado.
- Recortar o rotar la foto en la app.
