export type UserRole = "admin" | "director" | "subdirector" | "actor";

export type TheatricalRole = "principal" | "suplente" | "staff";

export type AttendanceStatus =
  | "presente"
  | "ausente"
  | "tarde"
  | "justificado";

export type TutorTitle = "Dr." | "Ing." | "Maestro";

export type PlayStatus = "activa" | "pausada" | "finalizada";

export interface Profile {
  id: string;
  nombre: string;
  correo: string;
  rol: UserRole;
  carrera: string | null;
  tutor_titulo: TutorTitle | null;
  tutor_nombre: string | null;
  grupo: string | null;
  horario_clases: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Play {
  id: string;
  titulo: string;
  descripcion: string | null;
  director_id: string;
  subdirector_id: string | null;
  guion_url: string | null;
  utileria: string | null;
  dias_asignados: string | null;
  estado: PlayStatus;
  created_at?: string;
  updated_at?: string;
}

export interface PlayMember {
  id: string;
  play_id: string;
  user_id: string;
  rol_teatral: TheatricalRole;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  play_id: string;
  user_id: string;
  fecha: string;
  estado: AttendanceStatus;
  observaciones: string | null;
  created_at?: string;
}

/** Play with its related members and the profiles attached to each member. */
export interface PlayMemberWithProfile extends PlayMember {
  profiles: Profile | null;
}

export interface PlayWithRelations extends Play {
  director?: Profile | null;
  subdirector?: Profile | null;
  play_members?: PlayMemberWithProfile[];
}

export interface AttendanceRecordWithProfile extends AttendanceRecord {
  profiles: Profile | null;
}
