# Quickstart: validar Fotos de progreso

0. Aplicar `supabase/migrations/20261113150000_fotos_progreso.sql` (`supabase db push --remote`).
   En el dashboard de Supabase, Storage tiene que mostrar el bucket `fotos-progreso` privado.
1. `npm test` → pasa `lib/fotos.test.ts`.
2. Estadísticas → "Fotos de progreso": sin fotos, se ve el texto vacío y el formulario.
3. Subir una foto de celular (3 MB o más): sube y aparece con la fecha de hoy. En Storage pesa
   menos de 1 MB y no tiene ubicación GPS (revisar el EXIF del archivo descargado).
4. Subir otra con la misma fecha: reemplaza a la anterior y sigue habiendo una sola.
5. Subir una con fecha de hace un mes: queda primera en la línea de tiempo. La fecha no deja
   elegir mañana.
6. Tocar una foto: se abre en grande. Copiar esa URL y abrirla en otra sesión: funciona hasta
   que vence (1 h). Con el path de otro usuario, Storage devuelve error.
7. Borrar una foto: pide confirmación y desaparece.
8. "Descargar mis datos" (con contraseña): el JSON trae `fotos` con fecha y URL, y la URL
   descarga la foto.
9. Con una cuenta de prueba con fotos, "Borrar mi cuenta": en Storage no queda su carpeta.
10. `/privacidad` menciona las fotos.
