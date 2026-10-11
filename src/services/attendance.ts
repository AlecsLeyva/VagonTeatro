import { supabase } from "@/lib/supabaseClient";
import type { AttendanceRecord, AttendanceStatus } from "@/types";

export async function listAttendance(
  playId: string,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("play_id", playId)
    .order("fecha", { ascending: true });
  if (error) throw error;
  return (data as AttendanceRecord[]) ?? [];
}

export interface AttendanceUpsertInput {
  play_id: string;
  user_id: string;
  fecha: string;
  estado: AttendanceStatus;
  observaciones: string | null;
}

/**
 * Creates or updates an attendance record. Relies on a unique constraint over
 * (play_id, user_id, fecha). If the constraint is missing, falls back to a
 * manual select + update/insert.
 */
export async function upsertAttendance(
  input: AttendanceUpsertInput,
): Promise<AttendanceRecord> {
  const { data, error } = await supabase
    .from("attendance_records")
    .upsert(input, { onConflict: "play_id,user_id,fecha" })
    .select("*")
    .single();

  if (!error) return data as AttendanceRecord;

  const missingConstraint =
    error.code === "42P10" ||
    /no unique|on conflict/i.test(`${error.message} ${error.details ?? ""}`);
  if (!missingConstraint) throw error;

  const { data: existing, error: selectError } = await supabase
    .from("attendance_records")
    .select("id")
    .eq("play_id", input.play_id)
    .eq("user_id", input.user_id)
    .eq("fecha", input.fecha)
    .maybeSingle();
  if (selectError) throw selectError;

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("attendance_records")
      .update({
        estado: input.estado,
        observaciones: input.observaciones,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (updateError) throw updateError;
    return updated as AttendanceRecord;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("attendance_records")
    .insert(input)
    .select("*")
    .single();
  if (insertError) throw insertError;
  return inserted as AttendanceRecord;
}

export async function deleteAttendance(recordId: string): Promise<void> {
  const { error } = await supabase
    .from("attendance_records")
    .delete()
    .eq("id", recordId);
  if (error) throw error;
}
