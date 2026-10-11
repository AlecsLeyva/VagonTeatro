import * as React from "react";
import { CalendarPlus, CalendarDays } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAttendance, upsertAttendance } from "@/services";
import {
  ATTENDANCE_LABELS,
  ATTENDANCE_ORDER,
  errorMessage,
  formatDate,
  todayISO,
} from "@/lib/utils";
import type {
  AttendanceRecord,
  AttendanceStatus,
  PlayMemberWithProfile,
  Profile,
} from "@/types";

interface AttendanceTabProps {
  playId: string;
  members: PlayMemberWithProfile[];
  profile: Profile;
  canManage: boolean;
}

const ESTADO_STYLES: Record<AttendanceStatus, string> = {
  presente: "border-emerald-300 bg-emerald-50 text-emerald-900",
  ausente: "border-red-300 bg-red-50 text-red-900",
  tarde: "border-amber-300 bg-amber-50 text-amber-900",
  justificado: "border-sky-300 bg-sky-50 text-sky-900",
};

/** Nomenclatura tipo universidad para el registro de asistencia del alumno. */
const UNIVERSITY_LABELS: Record<AttendanceStatus, string> = {
  presente: "Asistió",
  ausente: "Falta",
  tarde: "Retardo",
  justificado: "Justificado",
};

function recordKey(userId: string, fecha: string) {
  return `${userId}|${fecha}`;
}

export function AttendanceTab({
  playId,
  members,
  profile,
  canManage,
}: AttendanceTabProps) {
  const [records, setRecords] = React.useState<Record<string, AttendanceRecord>>(
    {},
  );
  const [extraDates, setExtraDates] = React.useState<string[]>([]);
  const [newDate, setNewDate] = React.useState(todayISO());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingCell, setSavingCell] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    listAttendance(playId)
      .then((data) => {
        if (!active) return;
        const map: Record<string, AttendanceRecord> = {};
        for (const record of data) {
          map[recordKey(record.user_id, record.fecha)] = record;
        }
        setRecords(map);
      })
      .catch((err: Error) => active && setError(errorMessage(err, "Error al cargar la asistencia.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [playId]);

  const dates = React.useMemo(() => {
    const set = new Set<string>(extraDates);
    for (const record of Object.values(records)) set.add(record.fecha);
    return Array.from(set).sort();
  }, [records, extraDates]);

  const myRecords = React.useMemo(
    () =>
      Object.values(records)
        .filter((record) => record.user_id === profile.id)
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [records, profile.id],
  );

  function addDate() {
    if (!newDate) return;
    setExtraDates((prev) => Array.from(new Set([...prev, newDate])));
    setNewDate(todayISO());
  }

  async function persist(
    userId: string,
    fecha: string,
    estado: AttendanceStatus,
    observaciones: string | null,
  ) {
    const key = recordKey(userId, fecha);
    setSavingCell(key);
    setError(null);
    try {
      const saved = await upsertAttendance({
        play_id: playId,
        user_id: userId,
        fecha,
        estado,
        observaciones,
      });
      setRecords((prev) => ({ ...prev, [key]: saved }));
    } catch (err) {
      setError(errorMessage(err, "No se pudo guardar el registro de asistencia."));
    } finally {
      setSavingCell(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8 text-stage" />
      </div>
    );
  }

  if (!canManage) {
    return <MyAttendanceView records={myRecords} error={error} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Control de asistencia</CardTitle>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Agregar fecha de ensayo
              </label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-9 w-40"
              />
            </div>
            <Button onClick={addDate} size="sm" className="gap-2">
              <CalendarPlus className="h-4 w-4" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          {members.length === 0 ? (
            <Alert variant="warning" title="Sin integrantes">
              Agrega integrantes al elenco en la pestaña "Elenco" antes de pasar
              lista.
            </Alert>
          ) : dates.length === 0 ? (
            <Alert variant="info" title="Sin fechas registradas">
              Agrega una fecha de ensayo para comenzar a registrar la asistencia.
            </Alert>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="sticky left-0 z-10 min-w-[190px] border-b border-r border-border bg-muted/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Integrante
                    </th>
                    {dates.map((date) => (
                      <th
                        key={date}
                        className="min-w-[180px] border-b border-l border-border px-3 py-2 text-left text-xs font-semibold text-muted-foreground"
                      >
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {date}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="odd:bg-background">
                      <td className="sticky left-0 z-10 border-b border-r border-border bg-background px-3 py-2 font-medium">
                        {member.profiles?.nombre ?? "Usuario"}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {member.profiles?.carrera ?? "Sin carrera"}
                        </span>
                      </td>
                      {dates.map((date) => (
                        <AttendanceCell
                          key={recordKey(member.user_id, date)}
                          memberId={member.user_id}
                          fecha={date}
                          record={records[recordKey(member.user_id, date)]}
                          saving={savingCell === recordKey(member.user_id, date)}
                          onPersist={persist}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface MyAttendanceViewProps {
  records: AttendanceRecord[];
  error: string | null;
}

function MyAttendanceView({ records, error }: MyAttendanceViewProps) {
  const total = records.length;
  const counts = ATTENDANCE_ORDER.reduce<Record<AttendanceStatus, number>>(
    (acc, status) => {
      acc[status] = records.filter((record) => record.estado === status).length;
      return acc;
    },
    { presente: 0, ausente: 0, tarde: 0, justificado: 0 },
  );
  const attended = counts.presente + counts.tarde + counts.justificado;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
  const barColor =
    percentage >= 80
      ? "bg-emerald-500"
      : percentage >= 60
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mi asistencia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}
        {records.length === 0 ? (
          <Alert variant="info" title="Sin registros">
              Todavía no se ha registrado tu asistencia en esta obra.

          </Alert>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-border bg-muted/40 p-4 sm:col-span-2 lg:col-span-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Asistencia
                </p>
                <p className="mt-1 text-3xl font-bold leading-none">
                  {percentage}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {attended} de {total} sesiones
                </p>
              </div>
              {ATTENDANCE_ORDER.map((status) => (
                <div
                  key={status}
                  className={`rounded-xl border p-4 ${ESTADO_STYLES[status]}`}
                >
                  <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                    {UNIVERSITY_LABELS[status]}
                  </p>
                  <p className="mt-1 text-2xl font-bold leading-none">
                    {counts[status]}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Porcentaje de asistencia</span>
                <span className="font-medium text-foreground">
                  {percentage}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Sesión (fecha)</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Observaciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatDate(record.fecha)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${ESTADO_STYLES[record.estado]}`}
                        >
                          {UNIVERSITY_LABELS[record.estado]}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.observaciones?.trim() || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface AttendanceCellProps {
  memberId: string;
  fecha: string;
  record?: AttendanceRecord;
  saving: boolean;
  onPersist: (
    userId: string,
    fecha: string,
    estado: AttendanceStatus,
    observaciones: string | null,
  ) => void;
}

function AttendanceCell({
  memberId,
  fecha,
  record,
  saving,
  onPersist,
}: AttendanceCellProps) {
  const [observaciones, setObservaciones] = React.useState(
    record?.observaciones ?? "",
  );

  React.useEffect(() => {
    setObservaciones(record?.observaciones ?? "");
  }, [record?.observaciones]);

  const estado: AttendanceStatus = record?.estado ?? "presente";

  return (
    <td className="border-b border-l border-border px-3 py-2 align-top">
      <div className="flex items-center gap-2">
        <Select
          value={estado}
          onChange={(e) =>
            onPersist(memberId, fecha, e.target.value as AttendanceStatus, observaciones || null)
          }
          className={`h-9 w-36 border ${ESTADO_STYLES[estado]}`}
        >
          {ATTENDANCE_ORDER.map((option) => (
            <option key={option} value={option}>
              {ATTENDANCE_LABELS[option]}
            </option>
          ))}
        </Select>
        {saving && <Spinner className="h-3.5 w-3.5 text-stage" />}
      </div>
      <input
        type="text"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        onBlur={() =>
          onPersist(memberId, fecha, estado, observaciones.trim() || null)
        }
        placeholder="Observaciones..."
        className="mt-1.5 w-full rounded border border-input bg-background px-2 py-1 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </td>
  );
}
