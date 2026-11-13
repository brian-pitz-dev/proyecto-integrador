-- Fotos de progreso (specs/007-fotos-progreso). Sin tabla: el archivo `{user_id}/{fecha}.jpg`
-- es la fuente de verdad (research.md, Decisión 1). Bucket privado, solo JPEG de hasta 2 MB:
-- el navegador ya achica y convierte la foto, y Storage rechaza cualquier otra cosa aunque
-- alguien se saltee la app.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-progreso', 'fotos-progreso', false, 2097152, array['image/jpeg']);

-- Cada usuario solo toca su carpeta (primer segmento del path = su id), el mismo criterio por
-- dueño que las tablas.
create policy "fotos: leer las propias" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos-progreso' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos: subir a la carpeta propia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-progreso' and (storage.foldername(name))[1] = auth.uid()::text);

-- upsert (reemplazar la foto del mismo día) necesita update además de insert
create policy "fotos: reemplazar las propias" on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos-progreso' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'fotos-progreso' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "fotos: borrar las propias" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos-progreso' and (storage.foldername(name))[1] = auth.uid()::text);
