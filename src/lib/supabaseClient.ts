import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url =
  import.meta.env.VITE_SUPABASE_URL ||
  (import.meta.env as Record<string, string | undefined>)
    .NEXT_PUBLIC_SUPABASE_URL;

const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (import.meta.env as Record<string, string | undefined>)
    .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta.env as Record<string, string | undefined>)
    .NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltan las variables de entorno de Supabase. " +
      "Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env",
  );
}

export const MAX_ACTIVE_PLAYS = 5;

export const SCRIPTS_BUCKET =
  import.meta.env.VITE_SUPABASE_SCRIPTS_BUCKET || "scripts-guiones";

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
