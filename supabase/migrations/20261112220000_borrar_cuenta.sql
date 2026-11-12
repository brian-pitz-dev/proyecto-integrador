-- Baja de cuenta desde /perfil (derecho de supresión, Ley 25.326). Borra el usuario de
-- auth.users; perfil, evento, registro, plan_ia y uso_ia caen por su `on delete cascade`.
-- security definer en vez de la service role key en la app: solo puede borrarse a sí mismo
-- (auth.uid()), sin ningún parámetro que se pueda falsear desde el navegador.
create function public.borrar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'no autenticado';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;
