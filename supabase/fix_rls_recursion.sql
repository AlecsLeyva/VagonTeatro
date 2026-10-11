-- ============================================================================
-- VagonTeatro - FIX: "infinite recursion detected in policy for relation plays"
-- ----------------------------------------------------------------------------
-- Como aplicar:
--   1. Abre tu proyecto en https://supabase.com
--   2. Ve a "SQL Editor" -> "New query"
--   3. Pega TODO este archivo y presiona "Run"
--   4. Recarga la aplicación (F5) e intenta crear la obra de nuevo.
--
-- Este script es idempotente: se puede ejecutar varias veces sin problema.
-- (Equivale a volver a ejecutar supabase/schema.sql completo.)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Funciones auxiliares SECURITY DEFINER.
-- El problema: la política de "plays" consultaba "play_members" y la de
-- "play_members" volvía a consultar "plays" => recursión infinita.
-- Al declararlas SECURITY DEFINER, las consultas internas se ejecutan como el
-- dueño de la tabla y NO vuelven a disparar las políticas (se rompe el ciclo).
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin');
$$;

create or replace function public.is_director()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'director');
$$;

create or replace function public.is_play_member(p_play_id uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.play_members
    where play_id = p_play_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_play_manager(p_play_id uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.plays
    where id = p_play_id
      and (director_id = auth.uid() or subdirector_id = auth.uid())
  );
$$;

create or replace function public.is_any_play_director()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (select 1 from public.plays where director_id = auth.uid());
$$;

-- Vista segura para "Actores y horarios" (admin y directores) sin abrir RLS.
create or replace function public.cast_overview()
returns table (
  member_id uuid,
  play_id uuid,
  play_titulo text,
  play_estado text,
  play_director_id uuid,
  play_subdirector_id uuid,
  play_dias_asignados text,
  rol_teatral text,
  user_id uuid
)
language sql stable security definer set search_path = public, pg_temp
as $$
  select
    pm.id,
    pm.play_id,
    p.titulo,
    p.estado::text,
    p.director_id,
    p.subdirector_id,
    p.dias_asignados,
    pm.rol_teatral::text,
    pm.user_id
  from public.play_members pm
  join public.plays p on p.id = pm.play_id
  where public.is_admin() or public.is_director()
  order by p.titulo, pm.created_at;
$$;

create or replace function public.assign_play_subdirector(p_play_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_prev uuid;
  v_remaining integer;
begin
  if not (
    public.is_admin()
    or exists (
      select 1 from public.plays
      where id = p_play_id and director_id = auth.uid()
    )
  ) then
    raise exception 'No autorizado para asignar subdirector.'
      using errcode = 'insufficient_privilege';
  end if;

  select subdirector_id into v_prev from public.plays where id = p_play_id;
  if not found then
    raise exception 'La obra no existe.' using errcode = 'no_data_found';
  end if;

  update public.plays set subdirector_id = p_user_id where id = p_play_id;

  if p_user_id is not null then
    update public.profiles
       set rol = 'subdirector'
     where id = p_user_id and rol = 'actor';
  end if;

  if v_prev is not null and v_prev is distinct from p_user_id then
    select count(*) into v_remaining
      from public.plays
     where subdirector_id = v_prev;
    if v_remaining = 0 then
      update public.profiles
         set rol = 'actor'
       where id = v_prev and rol = 'subdirector';
    end if;
  end if;
end;
$$;

grant execute on function public.cast_overview() to authenticated;
grant execute on function public.assign_play_subdirector(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Redefinir políticas usando los helpers (sin referencias cruzadas).
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.plays enable row level security;
alter table public.play_members enable row level security;
alter table public.attendance_records enable row level security;

-- PROFILES
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin" on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- PLAYS
drop policy if exists "plays_select" on public.plays;
create policy "plays_select" on public.plays
  for select to authenticated using (
    public.is_admin()
    or director_id = auth.uid()
    or subdirector_id = auth.uid()
    or public.is_play_member(id)
  );

drop policy if exists "plays_insert_director" on public.plays;
create policy "plays_insert_director" on public.plays
  for insert to authenticated with check (
    public.is_admin() or director_id = auth.uid()
  );

drop policy if exists "plays_update_manager" on public.plays;
create policy "plays_update_manager" on public.plays
  for update to authenticated using (
    public.is_admin() or director_id = auth.uid() or subdirector_id = auth.uid()
  ) with check (
    public.is_admin() or director_id = auth.uid() or subdirector_id = auth.uid()
  );

drop policy if exists "plays_delete_director" on public.plays;
create policy "plays_delete_director" on public.plays
  for delete to authenticated using (
    public.is_admin() or director_id = auth.uid()
  );

-- PLAY MEMBERS
drop policy if exists "play_members_select" on public.play_members;
create policy "play_members_select" on public.play_members
  for select to authenticated using (
    public.is_admin()
    or user_id = auth.uid()
    or public.is_play_manager(play_id)
    -- Permite que un actor vea a los compañeros de las obras a las que pertenece.
    or public.is_play_member(play_id)
  );

drop policy if exists "play_members_manage" on public.play_members;
create policy "play_members_manage" on public.play_members
  for all to authenticated using (
    public.is_admin() or public.is_play_manager(play_id)
  ) with check (
    public.is_admin() or public.is_play_manager(play_id)
  );

-- ATTENDANCE
drop policy if exists "attendance_select" on public.attendance_records;
create policy "attendance_select" on public.attendance_records
  for select to authenticated using (
    public.is_admin()
    or user_id = auth.uid()
    or public.is_play_manager(play_id)
  );

drop policy if exists "attendance_manage" on public.attendance_records;
create policy "attendance_manage" on public.attendance_records
  for all to authenticated using (
    public.is_admin() or public.is_play_manager(play_id)
  ) with check (
    public.is_admin() or public.is_play_manager(play_id)
  );

-- ---------------------------------------------------------------------------
-- 3. El trigger de "máximo 5 obras" también consulta "plays"; lo hacemos
--    SECURITY DEFINER para que no dispare las políticas al insertar.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_max_active_plays()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  active_count integer;
  max_active constant integer := 5;
begin
  if new.estado = 'activa' then
    select count(*) into active_count
    from public.plays
    where director_id = new.director_id
      and estado = 'activa'
      and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

    if active_count >= max_active then
      raise exception 'Límite de obras activas alcanzado: un director no puede tener más de % obras activas simultáneas.', max_active
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_max_active_plays on public.plays;
create trigger trg_enforce_max_active_plays
  before insert or update on public.plays
  for each row execute function public.enforce_max_active_plays();

-- ---------------------------------------------------------------------------
-- 4. Storage (guiones) - evita la misma recursión.
-- ---------------------------------------------------------------------------
drop policy if exists "scripts_insert" on storage.objects;
create policy "scripts_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'scripts-guiones'
    and (public.is_admin() or public.is_any_play_director())
  );

-- ---------------------------------------------------------------------------
-- 5. Comprobación (opcional): según el resultado de estas consultas.
--    relforcerowsecurity debe ser "false" para que los SECURITY DEFINER
--    puedan saltarse las políticas. owners deben coincidir.
-- ---------------------------------------------------------------------------
-- select relname, relrowsecurity, relforcerowsecurity
--   from pg_class
--  where relname in ('plays','play_members','attendance_records','profiles');

-- select proname, prosecdef, pg_get_userbyid(proowner) as owner
--   from pg_proc
--  where proname in ('is_admin','is_play_member','is_play_manager','is_any_play_director');
