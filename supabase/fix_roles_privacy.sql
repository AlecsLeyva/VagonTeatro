-- ============================================================================
-- VagonTeatro - FIX de seguridad: roles y privacidad de perfiles
-- ----------------------------------------------------------------------------
-- Resuelve:
--   1) Escalada de privilegios a 'admin' desde el registro. `handle_new_user`
--      tomaba el rol de los metadatos del cliente, así que cualquiera podía
--      registrarse con rol 'admin' llamando directo a la API de Supabase.
--   2) Auto-ascenso de rol: la política de perfiles permitía a cada usuario
--      actualizar su propia columna `rol` desde el cliente.
--   3) Fuga de correos: cualquier usuario autenticado leía el correo de todos.
--   4) Bloqueo del sistema: un admin podía degradar al último admin.
--
-- Enfoque:
--   - `handle_new_user` solo acepta actor/subdirector/director (nunca admin).
--   - Los cambios de rol se hacen SOLO por el RPC `admin_set_user_role`,
--     con la guarda de "al menos un admin".
--   - Se quita de `authenticated` el privilegio de UPDATE sobre la columna
--     `rol` (privilegios por columna) y se conserva el resto.
--   - El correo se expone a través de la vista `profiles_directory`, que solo
--     lo devuelve a admin, directores y al propio usuario.
--
-- Como aplicar:
--   1. Supabase -> SQL Editor -> New query.
--   2. Pega TODO este archivo y presiona "Run".
--   3. Recarga la aplicación (F5).
--
-- Es idempotente: se puede ejecutar varias veces sin problema.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Alta de usuario: nunca permitir 'admin' desde los metadatos del cliente.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_meta text := new.raw_user_meta_data ->> 'rol';
  v_rol user_role := 'actor';
begin
  if v_meta in ('actor', 'subdirector', 'director') then
    v_rol := v_meta::user_role;
  end if;

  insert into public.profiles (id, nombre, correo, rol)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'nombre', ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    v_rol
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. RPC: cambiar el rol de un usuario (solo admin, protege al último admin).
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_user_role(p_user_id uuid, p_rol user_role)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_other_admins integer;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar roles.'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'El usuario no existe.' using errcode = 'no_data_found';
  end if;

  if p_rol <> 'admin' then
    select count(*) into v_other_admins
      from public.profiles
     where rol = 'admin' and id <> p_user_id;
    if v_other_admins = 0 then
      raise exception 'Debe existir al menos un administrador.'
        using errcode = 'check_violation';
    end if;
  end if;

  update public.profiles set rol = p_rol where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_user_role(uuid, user_role) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Vista de perfiles: el correo solo lo ven admin, directores y uno mismo.
--    (La vista se ejecuta como su dueño, por lo que ignora las RLS de la
--    tabla base; el enmascaramiento del correo se hace aquí.)
-- ---------------------------------------------------------------------------
create or replace view public.profiles_directory as
select
  id,
  nombre,
  rol,
  carrera,
  tutor_titulo,
  tutor_nombre,
  grupo,
  horario_clases,
  case
    when public.is_admin() or public.is_director() or id = auth.uid()
      then correo
    else null
  end as correo,
  created_at,
  updated_at
from public.profiles;

grant select on public.profiles_directory to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Privilegios por columna.
--    - UPDATE: todos menos `rol` (el rol solo cambia por el RPC).
--    - SELECT: se revoca la tabla y se deja solo la vista para el correo.
-- ---------------------------------------------------------------------------
revoke update on public.profiles from authenticated, anon;
grant update (nombre, carrera, tutor_titulo, tutor_nombre, grupo, horario_clases)
  on public.profiles to authenticated;

revoke select on public.profiles from authenticated, anon;
grant select (id, nombre, rol, carrera, tutor_titulo, tutor_nombre, grupo, horario_clases, created_at, updated_at)
  on public.profiles to authenticated;

-- service_role conserva acceso total (por defecto en Supabase).
grant select, update on public.profiles to service_role;

-- ---------------------------------------------------------------------------
-- 5. Storage: bucket de guiones privado, acceso por membresía de la obra.
--    Las lecturas pasan a usar signed URLs (ver resolveScriptUrl en la app).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('scripts-guiones', 'scripts-guiones', false)
on conflict (id) do update set public = false;

-- El primer nivel de la ruta es el id de la obra: "<play_id>/<archivo>".
drop policy if exists "scripts_read" on storage.objects;
create policy "scripts_read" on storage.objects
  for select to authenticated using (
    bucket_id = 'scripts-guiones'
    and (
      public.is_admin()
      or public.is_play_manager(
        case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
             then ((storage.foldername(name))[1])::uuid end
      )
      or public.is_play_member(
        case when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
             then ((storage.foldername(name))[1])::uuid end
      )
    )
  );

drop policy if exists "scripts_insert" on storage.objects;
create policy "scripts_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'scripts-guiones'
    and (public.is_admin() or public.is_any_play_director())
  );

drop policy if exists "scripts_delete" on storage.objects;
create policy "scripts_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'scripts-guiones'
    and (public.is_admin() or owner = auth.uid())
  );
