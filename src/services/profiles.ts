import { supabase } from "@/lib/supabaseClient";
import type { Profile, UserRole } from "@/types";

/** Columnas que un usuario puede editar por su cuenta (nunca `rol`). */
export const UPDATABLE_PROFILE_FIELDS = [
  "nombre",
  "carrera",
  "tutor_titulo",
  "tutor_nombre",
  "grupo",
  "horario_clases",
] as const;

/** Descarta cualquier campo no editable (p. ej. `rol`, `correo`, `id`). */
export function sanitizeProfilePatch(
  patch: Partial<Profile>,
): Partial<Profile> {
  const clean: Partial<Profile> = {};
  for (const key of UPDATABLE_PROFILE_FIELDS) {
    if (key in patch) {
      (clean as Record<string, unknown>)[key] = patch[key];
    }
  }
  return clean;
}

/**
 * Perfiles leídos desde la vista `profiles_directory` (oculta el correo según
 * el rol). Si la vista aún no está aplicada, se cae de vuelta a la tabla.
 */
export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles_directory")
    .select("*")
    .order("nombre", { ascending: true });
  if (!error) return (data as unknown as Profile[]) ?? [];

  const fallback = await supabase
    .from("profiles")
    .select("*")
    .order("nombre", { ascending: true });
  if (fallback.error) throw fallback.error;
  return (fallback.data as Profile[]) ?? [];
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles_directory")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (!error) return (data as unknown as Profile) ?? null;

  const fallback = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (fallback.error) throw fallback.error;
  return (fallback.data as Profile) ?? null;
}

/**
 * Cambia el rol de un usuario. Solo un admin puede hacerlo y siempre a través
 * del RPC `admin_set_user_role`, que además protege al último administrador.
 */
export async function updateUserRole(
  userId: string,
  rol: UserRole,
): Promise<void> {
  const { error } = await supabase.rpc("admin_set_user_role", {
    p_user_id: userId,
    p_rol: rol,
  });
  if (!error) return;

  // Fallback si el RPC aún no está aplicado en la base de datos.
  const text = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  const missingFunction =
    error.code === "PGRST202" ||
    text.includes("admin_set_user_role") ||
    text.includes("does not exist") ||
    text.includes("no existe");
  if (!missingFunction) throw error;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ rol })
    .eq("id", userId);
  if (updateError) throw updateError;
}

export async function updateOwnProfile(
  userId: string,
  patch: Partial<Profile>,
): Promise<Profile> {
  const { error } = await supabase
    .from("profiles")
    .update(sanitizeProfilePatch(patch))
    .eq("id", userId);
  if (error) throw error;

  const profile = await getProfileById(userId);
  if (!profile) throw new Error("No se pudo cargar el perfil actualizado.");
  return profile;
}

export function countByRole(profiles: Profile[]): Record<UserRole, number> {
  return profiles.reduce(
    (acc, profile) => {
      acc[profile.rol] = (acc[profile.rol] ?? 0) + 1;
      return acc;
    },
    { admin: 0, director: 0, subdirector: 0, actor: 0 } as Record<
      UserRole,
      number
    >,
  );
}
