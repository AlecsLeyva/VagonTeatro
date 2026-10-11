import { SCRIPTS_BUCKET, supabase } from "@/lib/supabaseClient";

export interface UploadedScript {
  path: string;
}

export async function uploadScript(
  playId: string,
  file: File,
): Promise<UploadedScript> {
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `${playId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(SCRIPTS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "application/pdf",
    });
  if (error) throw error;

  return { path };
}

export async function createSignedScriptUrl(
  path: string,
  expiresIn = 60 * 60,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(SCRIPTS_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeScript(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(SCRIPTS_BUCKET)
    .remove([path]);
  if (error) throw error;
}

/**
 * Resolves a stored `guion_url` to a usable signed URL. El bucket es privado,
 * así que tanto una ruta (`<play>/<archivo>`) como una URL pública antigua se
 * convierten en una URL firmada temporal.
 */
export async function resolveScriptUrl(guionUrl: string): Promise<string> {
  if (/^https?:\/\//i.test(guionUrl)) {
    const path = pathFromPublicUrl(guionUrl);
    return path ? createSignedScriptUrl(path) : guionUrl;
  }
  return createSignedScriptUrl(guionUrl);
}

/** Extracts the object path from a stored public URL, if possible. */
export function pathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${SCRIPTS_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

/**
 * Normaliza un `guion_url` almacenado a la ruta del objeto en el bucket,
 * aceptando tanto rutas nuevas como URLs públicas antiguas.
 */
export function objectPathFromStored(value: string): string {
  return pathFromPublicUrl(value) ?? value;
}

/** Nombre de archivo legible a partir de un `guion_url` almacenado. */
export function scriptFileName(value: string): string {
  const path = objectPathFromStored(value);
  const parts = path.split("/");
  const last = parts[parts.length - 1] ?? path;
  return last.replace(/^\d+-/, "") || last;
}
