import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { getProfileById, updateOwnProfile } from "@/services";
import type { Profile } from "@/types";
import {
  AuthContext,
  type AuthContextValue,
  type RegisterPayload,
} from "./AuthContext";

async function fetchProfile(userId: string): Promise<Profile | null> {
  return getProfileById(userId);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<
    AuthContextValue["session"]
  >(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadProfile = React.useCallback(async (userId: string) => {
    try {
      const data = await fetchProfile(userId);
      setProfile(data);
      return data;
    } catch (error) {
      console.error("Error al cargar el perfil:", error);
      setProfile(null);
      return null;
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        if (data.session?.user) {
          await loadProfile(data.session.user.id);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession?.user) {
          void loadProfile(nextSession.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = React.useCallback(async (correo: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });
    if (error) throw error;
  }, []);

  const signUp = React.useCallback(async (payload: RegisterPayload) => {
    const { data, error } = await supabase.auth.signUp({
      email: payload.correo,
      password: payload.password,
      options: {
        data: { nombre: payload.nombre, rol: payload.rol },
      },
    });
    if (error) throw error;

    const userId = data.user?.id;
    if (userId) {
      // Solo crea el perfil si el trigger `handle_new_user` aún no lo hizo.
      // `ignoreDuplicates` evita sobrescribir (y sobre todo, evitar tocar `rol`).
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          nombre: payload.nombre,
          correo: payload.correo,
          rol: payload.rol,
          carrera: payload.carrera || null,
          tutor_titulo:
            (payload.tutor_titulo as Profile["tutor_titulo"]) || null,
          tutor_nombre: payload.tutor_nombre || null,
          grupo: payload.grupo || null,
          horario_clases: payload.horario_clases || null,
        },
        { onConflict: "id", ignoreDuplicates: true },
      );
      if (profileError) {
        console.error("No se pudo crear el perfil:", profileError.message);
      }
    }

    return { needsConfirmation: !data.session };
  }, []);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const resetPassword = React.useCallback(async (correo: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  const resendConfirmation = React.useCallback(async (correo: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: correo,
    });
    if (error) throw error;
  }, []);

  const updatePassword = React.useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const refreshProfile = React.useCallback(async () => {
    if (!session?.user) return null;
    return loadProfile(session.user.id);
  }, [session, loadProfile]);

  const updateProfile = React.useCallback(
    async (patch: Partial<Profile>) => {
      if (!session?.user) throw new Error("No hay sesión activa");
      const updated = await updateOwnProfile(session.user.id, patch);
      setProfile(updated);
      return updated;
    },
    [session],
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isAuthenticated: Boolean(session?.user),
      signIn,
      signUp,
      signOut,
      resetPassword,
      resendConfirmation,
      updatePassword,
      refreshProfile,
      updateProfile,
    }),
    [
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      resendConfirmation,
      updatePassword,
      refreshProfile,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
