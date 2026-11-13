# Research: Fotos de progreso

## Decisión 1 — Sin tabla: el bucket es la fuente de verdad

El diseño original (§9 del plan de spec 004) proponía una tabla `foto_progreso` con
`storage_path` y `nota`. Como hay una foto por día y la nota quedó fuera de alcance, el path
`{user_id}/{fecha}.jpg` ya lo dice todo. La lista sale de `storage.list(user_id)`. Sin tabla
no hay que mantener filas y archivos sincronizados, ni sumarla a la exportación o al borrado
en cascada.

Si algún día hacen falta notas, va una tabla con `(user_id, fecha)` como clave.

## Decisión 2 — El navegador achica la foto y la sube una Server Action

- La sesión vive en cookies httpOnly (spec 003), así que no hay cliente de Supabase en el
  navegador para subir directo a Storage. Una URL de subida firmada evitaría el límite de
  tamaño, pero suma un segundo viaje y otra acción para registrar el archivo.
- Las Server Actions aceptan 1 MB por defecto. Una foto de celular pesa 3-8 MB, pero
  achicada a 1600 px en JPEG al 85 % queda en 200-600 KB. `next.config.ts` sube el límite a
  2 MB para tener margen, y el servidor rechaza lo que pase de 1,5 MB.
- Achicar en el navegador (canvas) también borra el EXIF. Las fotos de celular traen la
  ubicación GPS, y una foto de progreso suele sacarse en casa.

## Decisión 3 — Políticas de Storage por carpeta

`storage.objects` tiene RLS. Las cuatro políticas (select, insert, update, delete) del bucket
`fotos-progreso` exigen `(storage.foldername(name))[1] = auth.uid()::text`: cada usuario solo
toca su carpeta. Es el mismo criterio por dueño que usan las tablas. El bucket se crea en la
migración (`insert into storage.buckets`) con `public = false`, un límite de 2 MB y solo
`image/jpeg`, así que Storage rechaza cualquier otra cosa aunque se saltee la app.

## Decisión 4 — Borrar la cuenta borra primero las fotos

`borrar_mi_cuenta()` borra `auth.users` y las tablas caen en cascada, pero los archivos de
Storage no son filas de esas tablas: quedarían huérfanos. Además, Supabase no deja borrar
`storage.objects` por SQL (hay que usar la API de Storage). Por eso `borrarCuenta` borra las
fotos con la API antes de llamar a la función. Si falla, corta ahí y la cuenta queda intacta.

## Decisión 5 — La exportación lleva links, no las fotos

Meter las fotos en base64 en el JSON lo haría pesar decenas de MB. La exportación lista
`{ fecha, url }` con URLs firmadas a 7 días. El JSON lo aclara, y con eso alcanza para
descargarlas.
