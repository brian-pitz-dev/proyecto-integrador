# Feature Specification: Fotos de progreso

**Feature**: `007-fotos-progreso` | **Created**: 2026-11-13 | **Status**: Implementado, migración aplicada 2026-11-13; validado en Playwright (quickstart completo)

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

## Agregado después (2026-11-13)

- **Subir en un popup**: "Subir una foto" abre el selector y, al elegirla, un popup con la vista
  previa, botones para rotarla 90° (en el mismo canvas que ya la achicaba), la fecha y los datos
  opcionales.
- **Nota, peso y % de grasa por foto** (todos opcionales), al subirla o después con el lápiz. No
  hay tabla nueva: son filas de `registro` de la fecha de la foto, una por dato. La nota es
  `categoria = "foto"` (`valor = 0`, texto en `nota`); el peso es un `peso` más, así que cuenta
  en el progreso de peso (y si ya había un peso cargado ese día, la foto lo muestra); el % de
  grasa es `grasa`. Así entran en "Descargar mis datos" y se borran con la cuenta. Al subir, un
  campo vacío no toca lo que había; al editar, vaciarlo lo borra. Borrar la foto borra la nota y
  la grasa, y deja el peso (es un registro de peso del día).
- **Comparar dos fotos** lado a lado (con dos o más fotos): por defecto la primera (la de fecha
  más vieja) y la última, con los días entre las dos y la diferencia de peso y de grasa si las
  dos los tienen.

## Fuera de alcance

- Etiquetas (frente, perfil, espalda): con una foto por día no hay dónde poner varias poses;
  si hace falta, se anota en la nota.
- Recortar la foto en la app (se probó y se sacó: se hace en el celular antes de subirla).
- Rotar una foto ya subida: se vuelve a subir con la misma fecha y la reemplaza.
