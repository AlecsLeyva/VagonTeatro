-- ============================================================================
-- VagonTeatro - Esquema de base de datos (Supabase / PostgreSQL)
-- Ejecuta este script en el SQL Editor de Supabase.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tipos / ENUMs
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin', 'director', 'subdirector', 'actor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type theatrical_role as enum ('principal', 'suplente', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('presente', 'ausente', 'tarde', 'justificado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type play_status as enum ('activa', 'pausada', 'finalizada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tutor_title as enum ('Dr.', 'Ing.', 'Maestro');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Tablas
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  nombre          text not null,
  correo          text not null unique,
  rol             user_role not null default 'actor',
  carrera         text,
  tutor_titulo    tutor_title,
  tutor_nombre    text,
  grupo           text,
  horario_clases  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.plays (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,
  descripcion     text,
  director_id     uuid not null references public.profiles (id) on delete cascade,
  subdirector_id  uuid references public.profiles (id) on delete set null,
  guion_url       text,
  utileria        text,
  dias_asignados  text,
  estado          play_status not null default 'activa',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.play_members (
  id           uuid primary key default gen_random_uuid(),
  play_id      uuid not null references public.plays (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  rol_teatral  theatrical_role not null default 'principal',
  created_at   timestamptz not null default now(),
  unique (play_id, user_id)
);

create table if not exists public.attendance_records (
  id              uuid primary key default gen_random_uuid(),
  play_id         uuid not null references public.plays (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  fecha           date not null,
  estado          attendance_status not null default 'presente',
  observaciones   text,
  created_at      timestamptz not null default now(),
  unique (play_id, user_id, fecha)
);

create index if not exists idx_plays_director on public.plays (director_id);
create index if not exists idx_plays_subdirector on public.plays (subdirector_id);
create index if not exists idx_play_members_play on public.play_members (play_id);
create index if not exists idx_play_members_user on public.play_members (user_id);
create index if not exists idx_attendance_play on public.attendance_records (play_id);
create index if not exists idx_attendance_play_date on public.attendance_records (play_id, fecha);

-- ----------------------------------------------------------------------------
-- 3. Trigger: máximo 5 obras ACTIVAS por director
-- ----------------------------------------------------------------------------
create or replace function public.enforce_max_active_plays()
returns trigger
language plpgsql security definer set search_path = public
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

-- ----------------------------------------------------------------------------
-- 4. Trigger: updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_plays_updated_at on public.plays;
create trigger trg_plays_updated_at
  before update on public.plays
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Trigger: crear perfil automáticamente al registrarse un usuario
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_meta text := new.raw_user_meta_data ->> 'rol';
  v_rol user_role := 'actor';
begin
  -- Nunca aceptar 'admin' desde los metadatos del cliente.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 6. Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.plays enable row level security;
alter table public.play_members enable row level security;
alter table public.attendance_records enable row level security;

-- Helper: rol del usuario actual
create or replace function public.current_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

-- Helper: extiende admin (evita recursión de RLS)
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin');
$$;

-- Helper: rol de director (para vistas de solo lectura sobre todo el elenco).
create or replace function public.is_director()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'director');
$$;

-- Helper: es miembro (elenco) de una obra. SECURITY DEFINER para evitar
-- recursión infinita entre las políticas de "plays" y "play_members".
create or replace function public.is_play_member(p_play_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.play_members
    where play_id = p_play_id and user_id = auth.uid()
  );
$$;

-- Helper: es director o subdirector de una obra. SECURITY DEFINER para evitar
-- recursión infinita entre las políticas de "plays" y "play_members".
create or replace function public.is_play_manager(p_play_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.plays
    where id = p_play_id
      and (director_id = auth.uid() or subdirector_id = auth.uid())
  );
$$;

-- Helper: es director de al menos una obra (usado por la política de storage).
create or replace function public.is_any_play_director()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.plays where director_id = auth.uid());
$$;

-- Vista segura para "Actores y horarios": devuelve el elenco de TODAS las obras
-- a admin y directores sin abrir las políticas RLS de plays/play_members.
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
language sql stable security definer set search_path = public
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

-- Asigna (o quita con null) el subdirector de una obra y mantiene sincronizado
-- el rol de plataforma: asciende actor -> subdirector al asignarlo y lo regresa
-- a actor cuando deja de ser subdirector de cualquier obra.
create or replace function public.assign_play_subdirector(p_play_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public
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

-- Cambiar el rol de un usuario (solo admin; protege al último admin).
create or replace function public.admin_set_user_role(p_user_id uuid, p_rol user_role)
returns void
language plpgsql security definer set search_path = public
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

-- PROFILES -------------------------------------------------------------------
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

-- Vista de perfiles: el correo solo lo ven admin, directores y uno mismo.
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

-- Privilegios por columna: el rol solo cambia por el RPC admin_set_user_role,
-- y el correo solo se lee a través de la vista.
revoke update on public.profiles from authenticated, anon;
grant update (nombre, carrera, tutor_titulo, tutor_nombre, grupo, horario_clases)
  on public.profiles to authenticated;

revoke select on public.profiles from authenticated, anon;
grant select (id, nombre, rol, carrera, tutor_titulo, tutor_nombre, grupo, horario_clases, created_at, updated_at)
  on public.profiles to authenticated;

-- PLAYS ----------------------------------------------------------------------
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

-- PLAY MEMBERS ---------------------------------------------------------------
drop policy if exists "play_members_select" on public.play_members;
create policy "play_members_select" on public.play_members
  for select to authenticated using (
    public.is_admin()
    or user_id = auth.uid()
    or public.is_play_manager(play_id)
    or public.is_play_member(play_id)
  );

drop policy if exists "play_members_manage" on public.play_members;
create policy "play_members_manage" on public.play_members
  for all to authenticated using (
    public.is_admin() or public.is_play_manager(play_id)
  ) with check (
    public.is_admin() or public.is_play_manager(play_id)
  );

-- ATTENDANCE -----------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 7. Storage: bucket privado para guiones (acceso por membresía de la obra)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('scripts-guiones', 'scripts-guiones', false)
on conflict (id) do update set public = false;

-- El primer nivel de la ruta es el id de la obra: "<play_id>/<archivo>".
-- Se guarda con un cast seguro para no reventar con rutas inesperadas.
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
