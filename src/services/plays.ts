import { supabase } from "@/lib/supabaseClient";
import type {
  Play,
  PlayMember,
  PlayMemberWithProfile,
  PlayWithRelations,
  Profile,
  TheatricalRole,
} from "@/types";

export async function getProfilesByIds(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  // Se lee de la vista que oculta el correo según el rol. Si aún no está
  // aplicada en la base de datos, se cae de vuelta a la tabla `profiles`.
  const { data, error } = await supabase
    .from("profiles_directory")
    .select("*")
    .in("id", ids);
  if (!error) return (data as unknown as Profile[]) ?? [];

  const fallback = await supabase.from("profiles").select("*").in("id", ids);
  if (fallback.error) throw fallback.error;
  return (fallback.data as Profile[]) ?? [];
}

/** Combina varias listas de obras, sin duplicados y más recientes primero. */
export function mergePlaysById(...lists: Play[][]): Play[] {
  const byId = new Map<string, Play>();
  for (const list of lists) {
    for (const play of list) byId.set(play.id, play);
  }
  return Array.from(byId.values()).sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? ""),
  );
}

function mapProfiles(list: Profile[]): Map<string, Profile> {
  return new Map(list.map((profile) => [profile.id, profile]));
}

/** Plays visible to the given profile, based on role. */
export async function listPlaysForProfile(
  profile: Profile,
): Promise<PlayWithRelations[]> {
  if (profile.rol === "admin") {
    const { data, error } = await supabase
      .from("plays")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return decoratePlays((data as Play[]) ?? []);
  }

  if (profile.rol === "actor") {
    const { data: memberships, error: memberError } = await supabase
      .from("play_members")
      .select("play_id")
      .eq("user_id", profile.id);
    if (memberError) throw memberError;
    const ids = (memberships ?? []).map((m) => m.play_id);
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from("plays")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return decoratePlays((data as Play[]) ?? []);
  }

  // director / subdirector: obras que gestiona + obras donde participa.
  const column = profile.rol === "director" ? "director_id" : "subdirector_id";
  const { data, error } = await supabase
    .from("plays")
    .select("*")
    .eq(column, profile.id);
  if (error) throw error;
  const managed = (data as Play[]) ?? [];

  const { data: memberships, error: memberError } = await supabase
    .from("play_members")
    .select("play_id")
    .eq("user_id", profile.id);
  if (memberError) throw memberError;
  const memberIds = Array.from(
    new Set((memberships ?? []).map((m) => m.play_id)),
  );

  let memberPlays: Play[] = [];
  if (memberIds.length > 0) {
    const { data: memberData, error: memberPlaysError } = await supabase
      .from("plays")
      .select("*")
      .in("id", memberIds);
    if (memberPlaysError) throw memberPlaysError;
    memberPlays = (memberData as Play[]) ?? [];
  }

  return decoratePlays(mergePlaysById(managed, memberPlays));
}

async function decoratePlays(plays: Play[]): Promise<PlayWithRelations[]> {
  if (plays.length === 0) return [];
  const directorIds = Array.from(
    new Set(
      plays
        .flatMap((play) => [play.director_id, play.subdirector_id])
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const profiles = await getProfilesByIds(directorIds);
  const byId = mapProfiles(profiles);
  return plays.map((play) => ({
    ...play,
    director: byId.get(play.director_id) ?? null,
    subdirector: play.subdirector_id
      ? byId.get(play.subdirector_id) ?? null
      : null,
  }));
}

/** Plays an actor/staff member belongs to, with their theatrical role. */
export interface ActorPlay {
  play: PlayWithRelations;
  rolTeatral: TheatricalRole;
}

export async function listActorPlays(userId: string): Promise<ActorPlay[]> {
  const { data: memberships, error: memberError } = await supabase
    .from("play_members")
    .select("*")
    .eq("user_id", userId);
  if (memberError) throw memberError;

  const members = (memberships as PlayMember[]) ?? [];
  if (members.length === 0) return [];

  const { data, error } = await supabase
    .from("plays")
    .select("*")
    .in(
      "id",
      members.map((member) => member.play_id),
    );
  if (error) throw error;

  const plays = await decoratePlays((data as Play[]) ?? []);
  const byId = new Map(plays.map((play) => [play.id, play]));

  return members
    .map((member) => {
      const play = byId.get(member.play_id);
      return play
        ? { play, rolTeatral: member.rol_teatral }
        : null;
    })
    .filter((entry): entry is ActorPlay => entry !== null);
}

/** A cast membership enriched with its play and the member's profile. */
export interface CastOverviewRow {
  memberId: string;
  playId: string;
  playTitulo: string;
  playEstado: Play["estado"];
  playDirectorId: string;
  playSubdirectorId: string | null;
  playDiasAsignados: string | null;
  rol_teatral: TheatricalRole;
  profile: Profile | null;
}

/**
 * Every cast membership across all plays, with play and profile data.
 *
 * Usa la función `cast_overview()` (SECURITY DEFINER) para que admin y
 * directores vean el elenco completo sin abrir las políticas RLS. Si la
 * función aún no está aplicada en la base de datos, cae de vuelta a las
 * consultas directas (que respetan RLS).
 */
export async function listCastOverview(): Promise<CastOverviewRow[]> {
  const { data, error } = await supabase.rpc("cast_overview");
  if (error || !data) {
    return listCastOverviewFallback();
  }

  const rows = data;
  const profiles = await getProfilesByIds(
    Array.from(new Set(rows.map((row) => row.user_id))),
  );
  const profileById = mapProfiles(profiles);

  return rows.map((row) => ({
    memberId: row.member_id,
    playId: row.play_id,
    playTitulo: row.play_titulo,
    playEstado: row.play_estado,
    playDirectorId: row.play_director_id,
    playSubdirectorId: row.play_subdirector_id,
    playDiasAsignados: row.play_dias_asignados,
    rol_teatral: row.rol_teatral,
    profile: profileById.get(row.user_id) ?? null,
  }));
}

async function listCastOverviewFallback(): Promise<CastOverviewRow[]> {
  const { data: membersData, error: membersError } = await supabase
    .from("play_members")
    .select("*")
    .order("created_at", { ascending: true });
  if (membersError) throw membersError;

  const members = (membersData as PlayMember[]) ?? [];
  if (members.length === 0) return [];

  const playIds = Array.from(new Set(members.map((member) => member.play_id)));
  const { data: playsData, error: playsError } = await supabase
    .from("plays")
    .select("id, titulo, estado, director_id, subdirector_id, dias_asignados")
    .in("id", playIds);
  if (playsError) throw playsError;

  const plays =
    (playsData as Pick<
      Play,
      | "id"
      | "titulo"
      | "estado"
      | "director_id"
      | "subdirector_id"
      | "dias_asignados"
    >[]) ?? [];
  const playById = new Map(plays.map((play) => [play.id, play]));

  const profiles = await getProfilesByIds(
    Array.from(new Set(members.map((member) => member.user_id))),
  );
  const profileById = mapProfiles(profiles);

  return members.map((member) => {
    const play = playById.get(member.play_id);
    return {
      memberId: member.id,
      playId: member.play_id,
      playTitulo: play?.titulo ?? "Obra",
      playEstado: play?.estado ?? "activa",
      playDirectorId: play?.director_id ?? "",
      playSubdirectorId: play?.subdirector_id ?? null,
      playDiasAsignados: play?.dias_asignados ?? null,
      rol_teatral: member.rol_teatral,
      profile: profileById.get(member.user_id) ?? null,
    };
  });
}

/**
 * Nombra (o quita, con `null`) al subdirector de una obra y sincroniza su rol
 * de plataforma mediante la función `assign_play_subdirector()`. Si la función
 * aún no existe, actualiza solo la obra (sin tocar roles globales).
 */
export async function assignPlaySubdirector(
  playId: string,
  userId: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("assign_play_subdirector", {
    p_play_id: playId,
    p_user_id: userId,
  });
  if (!error) return;

  const text = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  const missingFunction =
    error.code === "PGRST202" ||
    text.includes("assign_play_subdirector") ||
    text.includes("does not exist") ||
    text.includes("no existe");
  if (!missingFunction) throw error;

  await updatePlay(playId, { subdirector_id: userId });
}

/** Returns the number of members per play for the given play ids. */
export async function countMembersByPlay(
  playIds: string[],
): Promise<Record<string, number>> {
  if (playIds.length === 0) return {};
  const { data, error } = await supabase
    .from("play_members")
    .select("play_id")
    .in("play_id", playIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.play_id] = (counts[row.play_id] ?? 0) + 1;
  }
  return counts;
}

export async function countActivePlaysByDirector(
  directorId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("plays")
    .select("id", { count: "exact", head: true })
    .eq("director_id", directorId)
    .eq("estado", "activa");
  if (error) throw error;
  return count ?? 0;
}

export async function getPlay(playId: string): Promise<PlayWithRelations | null> {
  const { data, error } = await supabase
    .from("plays")
    .select("*")
    .eq("id", playId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [decorated] = await decoratePlays([data as Play]);
  return decorated ?? null;
}

export interface CreatePlayInput {
  titulo: string;
  descripcion: string | null;
  director_id: string;
  subdirector_id: string | null;
  dias_asignados: string | null;
  utileria: string | null;
  estado: Play["estado"];
}

export async function createPlay(input: CreatePlayInput): Promise<Play> {
  const { data, error } = await supabase
    .from("plays")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data as Play;
}

export async function updatePlay(
  playId: string,
  patch: Partial<Play>,
): Promise<Play> {
  const { data, error } = await supabase
    .from("plays")
    .update(patch)
    .eq("id", playId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Play;
}

export async function deletePlay(playId: string): Promise<void> {
  const { error } = await supabase.from("plays").delete().eq("id", playId);
  if (error) throw error;
}

/** Returns whether the given director can create another active play. */
export async function canCreateActivePlay(
  directorId: string,
  maxActive: number,
): Promise<boolean> {
  const count = await countActivePlaysByDirector(directorId);
  return count < maxActive;
}

export async function listPlayMembers(
  playId: string,
): Promise<PlayMemberWithProfile[]> {
  const { data, error } = await supabase
    .from("play_members")
    .select("*")
    .eq("play_id", playId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const members = (data as PlayMember[]) ?? [];
  const profiles = await getProfilesByIds(
    members.map((member) => member.user_id),
  );
  const byId = mapProfiles(profiles);
  return members.map((member) => ({
    ...member,
    profiles: byId.get(member.user_id) ?? null,
  }));
}

export async function addPlayMember(
  playId: string,
  userId: string,
  rolTeatral: TheatricalRole,
): Promise<PlayMember> {
  const { data, error } = await supabase
    .from("play_members")
    .insert({ play_id: playId, user_id: userId, rol_teatral: rolTeatral })
    .select("*")
    .single();
  if (error) throw error;
  return data as PlayMember;
}

export async function updatePlayMember(
  memberId: string,
  rolTeatral: TheatricalRole,
): Promise<void> {
  const { error } = await supabase
    .from("play_members")
    .update({ rol_teatral: rolTeatral })
    .eq("id", memberId);
  if (error) throw error;
}

export async function removePlayMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from("play_members")
    .delete()
    .eq("id", memberId);
  if (error) throw error;
}

/** Detects the Postgres trigger that limits active plays per director. */
export function isActivePlaysLimitError(error: {
  message?: string;
  details?: string;
  code?: string;
} | null): boolean {
  if (!error) return false;
  // The trigger raises with errcode = 'check_violation' (23514).
  if (error.code === "23514") return true;
  const text = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return (
    text.includes("obras activas") ||
    text.includes("active plays") ||
    text.includes("límite de obras")
  );
}
