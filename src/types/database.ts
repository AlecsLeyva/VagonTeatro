import type {
  AttendanceStatus,
  PlayStatus,
  TheatricalRole,
  TutorTitle,
  UserRole,
} from "./index";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nombre: string;
          correo: string;
          rol: UserRole;
          carrera: string | null;
          tutor_titulo: TutorTitle | null;
          tutor_nombre: string | null;
          grupo: string | null;
          horario_clases: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          nombre: string;
          correo: string;
          rol?: UserRole;
          carrera?: string | null;
          tutor_titulo?: TutorTitle | null;
          tutor_nombre?: string | null;
          grupo?: string | null;
          horario_clases?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nombre?: string;
          correo?: string;
          rol?: UserRole;
          carrera?: string | null;
          tutor_titulo?: TutorTitle | null;
          tutor_nombre?: string | null;
          grupo?: string | null;
          horario_clases?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      plays: {
        Row: {
          id: string;
          titulo: string;
          descripcion: string | null;
          director_id: string;
          subdirector_id: string | null;
          guion_url: string | null;
          utileria: string | null;
          dias_asignados: string | null;
          estado: PlayStatus;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          titulo: string;
          descripcion?: string | null;
          director_id: string;
          subdirector_id?: string | null;
          guion_url?: string | null;
          utileria?: string | null;
          dias_asignados?: string | null;
          estado?: PlayStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          titulo?: string;
          descripcion?: string | null;
          director_id?: string;
          subdirector_id?: string | null;
          guion_url?: string | null;
          utileria?: string | null;
          dias_asignados?: string | null;
          estado?: PlayStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      play_members: {
        Row: {
          id: string;
          play_id: string;
          user_id: string;
          rol_teatral: TheatricalRole;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          play_id: string;
          user_id: string;
          rol_teatral?: TheatricalRole;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          play_id?: string;
          user_id?: string;
          rol_teatral?: TheatricalRole;
          created_at?: string | null;
        };
        Relationships: [];
      };
      attendance_records: {
        Row: {
          id: string;
          play_id: string;
          user_id: string;
          fecha: string;
          estado: AttendanceStatus;
          observaciones: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          play_id: string;
          user_id: string;
          fecha: string;
          estado?: AttendanceStatus;
          observaciones?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          play_id?: string;
          user_id?: string;
          fecha?: string;
          estado?: AttendanceStatus;
          observaciones?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      profiles_directory: {
        Row: {
          id: string;
          nombre: string;
          rol: UserRole;
          carrera: string | null;
          tutor_titulo: TutorTitle | null;
          tutor_nombre: string | null;
          grupo: string | null;
          horario_clases: string | null;
          correo: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      admin_set_user_role: {
        Args: { p_user_id: string; p_rol: UserRole };
        Returns: null;
      };
      cast_overview: {
        Args: Record<string, never>;
        Returns: {
          member_id: string;
          play_id: string;
          play_titulo: string;
          play_estado: PlayStatus;
          play_director_id: string;
          play_subdirector_id: string | null;
          play_dias_asignados: string | null;
          rol_teatral: TheatricalRole;
          user_id: string;
        }[];
      };
      assign_play_subdirector: {
        Args: { p_play_id: string; p_user_id: string | null };
        Returns: null;
      };
    };
    Enums: {
      user_role: UserRole;
      theatrical_role: TheatricalRole;
      attendance_status: AttendanceStatus;
      play_status: PlayStatus;
      tutor_title: TutorTitle;
    };
    CompositeTypes: Record<string, never>;
  };
}
