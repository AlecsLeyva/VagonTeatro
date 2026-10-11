import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AttendanceStatus, UserRole } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrae un mensaje legible de cualquier error, incluidos los de Supabase
 * (PostgrestError no es una instancia de `Error`, por lo que `err.message`
 * si quiere siempre se perdía detrás de mensajes genéricos).
 */
export function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; details?: unknown; hint?: unknown };
    const msg = typeof e.message === "string" ? e.message : "";
    const details = typeof e.details === "string" ? e.details : "";
    const hint = typeof e.hint === "string" ? e.hint : "";
    const parts = [msg, details, hint];
    const text = parts
      .filter((part): part is string => Boolean(part?.trim()))
      .join(" ");
    if (text.trim()) return text.trim();
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  director: "Director",
  subdirector: "Subdirector",
  actor: "Actor / Staff",
};

export const THEATRICAL_ROLE_LABELS: Record<
  "principal" | "suplente" | "staff",
  string
> = {
  principal: "Principal",
  suplente: "Suplente",
  staff: "Staff",
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  presente: "Presente",
  ausente: "Ausente",
  tarde: "Tarde",
  justificado: "Justificado",
};

export const ATTENDANCE_ORDER: AttendanceStatus[] = [
  "presente",
  "ausente",
  "tarde",
  "justificado",
];

export const TUTOR_TITLES = ["Dr.", "Ing.", "Maestro"] as const;

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Normaliza texto para búsquedas: minúsculas, sin acentos y sin espacios
 * sobrantes. Permite que "angel" encuentre "Ángel" o "ramirez" encuentre
 * "Ramírez".
 */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Devuelve true si alguno de los campos contiene el término de búsqueda,
 * ignorando acentos y mayúsculas. Si el término es vacío, siempre es true.
 */
export function matchesText(query: string, ...fields: (string | null | undefined)[]): boolean {
  const term = normalizeText(query);
  if (!term) return true;
  return fields.some((field) => normalizeText(field ?? "").includes(term));
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
