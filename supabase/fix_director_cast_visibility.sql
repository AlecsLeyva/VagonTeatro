-- ============================================================================
-- VagonTeatro - FIX: "Actores y horarios" para admin y directores
-- ----------------------------------------------------------------------------
-- 1) Síntoma: en "Actores y horarios", un usuario con rol 'director' veía el
--    contador de obras en 0 (o vacío), aunque los actores si tuvieran obras.
--    Causa: las políticas RLS de `plays` y `play_members` solo permiten leer
--    las filas de las obras que uno dirige.
--
-- 2) Enfoque seguro: en lugar de abrir las políticas RLS (que permitía a
--    cualquier director leer TODAS las filas completas de plays/play_members),
--    exponemos solo las columnas necesarias a través de una función
--    SECURITY DEFINER `cast_overview()`. Así el director ve el elenco y los
--    horarios sin poder leer columnas sensibles ni modificar nada.
--
-- 3) Se añade `assign_play_subdirector()` para nombrar subdirector de una obra
--    y mantener sincronizado el rol de plataforma (actor -> subdirector y de
--    regreso a actor cuando ya no es subdirector de ninguna obra).
--
-- Como aplicar:
--   1. Abre tu proyecto en https://supabase.com
--   2. Ve a "SQL Editor" -> "New query"
--   3. Pega TODO este archivo y presiona "Run"
--   4. Recarga la aplicación (F5).
--
-- Es idempotente: se puede ejecutar varias veces sin problema. Si antes
-- ejecutaste la versión anterior de este archivo (que ensanchaba RLS), esta
-- versión la revierte.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper: el usuario actual tiene rol 'director'.
-- ---------------------------------------------------------------------------
create or replace function public.is_director()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'director');
$$;

-- ---------------------------------------------------------------------------
-- 2. PLAYS: se REVIERTE el ensanchado. Solo lectura de las obras propias o
--    de las que se es miembro. El elenco global se sirve por `cast_overview`.
-- ---------------------------------------------------------------------------
alter table public.plays enable row level security;

drop policy if exists "plays_select" on public.plays;
create policy "plays_select" on public.plays
  for select to authenticated using (
    public.is_admin()
    or director_id = auth.uid()
    or subdirector_id = auth.uid()
    or public.is_play_member(id)
  );

-- ---------------------------------------------------------------------------
-- 3. PLAY MEMBERS: se REVIERTE el ensanchado. Solo elenco de obras propias,
--    compañeros de obra o el propio usuario.
-- ---------------------------------------------------------------------------
alter table public.play_members enable row level security;

drop policy if exists "play_members_select" on public.play_members;
create policy "play_members_select" on public.play_members
  for select to authenticated using (
    public.is_admin()
    or user_id = auth.uid()
    or public.is_play_manager(play_id)
    or public.is_play_member(play_id)
  );

-- ---------------------------------------------------------------------------
-- 4. Vista segura del elenco completo (solo columnas necesarias).
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5. Nombrar subdirector con sincronización del rol de plataforma.
-- ---------------------------------------------------------------------------
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
