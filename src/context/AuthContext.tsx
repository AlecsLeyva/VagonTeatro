import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types";

export interface AcademicDetails {
  carrera?: string;
  tutor_titulo?: string;
  tutor_nombre?: string;
  grupo?: string;
  horario_clases?: string;
}

export interface RegisterPayload extends AcademicDetails {
  nombre: string;
  correo: string;
  password: string;
  rol: UserRole;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (correo: string, password: string) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (correo: string) => Promise<void>;
  resendConfirmation: (correo: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
  updateProfile: (patch: Partial<Profile>) => Promise<Profile>;
}

export const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
