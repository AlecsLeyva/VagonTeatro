import * as React from "react";
import { FileDown, Printer, ClipboardList } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { FullPageSpinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import {
  listPlayMembers,
  listPlaysForProfile,
} from "@/services";
import { errorMessage, THEATRICAL_ROLE_LABELS } from "@/lib/utils";
import { exportToExcel, printView, type ExportColumn } from "@/lib/export";
import type {
  PlayMemberWithProfile,
  PlayWithRelations,
  Profile,
} from "@/types";

interface JustificanteRow {
  nombre: string;
  carrera: string;
  tutorTitulo: string;
  tutorNombre: string;
  grupo: string;
  horario: string;
  rolTeatral: string;
  correo: string;
}

function toRow(member: PlayMemberWithProfile): JustificanteRow {
  const profile: Profile | null = member.profiles;
  return {
    nombre: profile?.nombre ?? "—",
    carrera: profile?.carrera ?? "—",
    tutorTitulo: profile?.tutor_titulo ?? "—",
    tutorNombre: profile?.tutor_nombre ?? "—",
    grupo: profile?.grupo ?? "—",
    horario: profile?.horario_clases ?? "—",
    rolTeatral: THEATRICAL_ROLE_LABELS[member.rol_teatral],
    correo: profile?.correo ?? "—",
  };
}

const EXPORT_COLUMNS: ExportColumn<JustificanteRow>[] = [
  { header: "Nombre completo", value: (r) => r.nombre },
  { header: "Carrera", value: (r) => r.carrera },
  { header: "Título del tutor", value: (r) => r.tutorTitulo },
  { header: "Nombre del tutor", value: (r) => r.tutorNombre },
  { header: "Grupo", value: (r) => r.grupo },
  { header: "Horario de clases", value: (r) => r.horario },
  { header: "Rol teatral", value: (r) => r.rolTeatral },
  { header: "Correo", value: (r) => r.correo },
];

export function JustificantesPage() {
  const { profile } = useAuth();
  const [plays, setPlays] = React.useState<PlayWithRelations[]>([]);
  const [selectedPlayId, setSelectedPlayId] = React.useState("");
  const [members, setMembers] = React.useState<PlayMemberWithProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMembers, setLoadingMembers] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!profile) return;
    let active = true;
    listPlaysForProfile(profile)
      .then((data) => {
        if (!active) return;
        setPlays(data);
        if (data[0]) setSelectedPlayId(data[0].id);
      })
      .catch((err: Error) => active && setError(errorMessage(err, "Error al cargar las obras.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profile]);

  React.useEffect(() => {
    if (!selectedPlayId) {
      setMembers([]);
      return;
    }
    let active = true;
    setLoadingMembers(true);
    listPlayMembers(selectedPlayId)
      .then((data) => active && setMembers(data))
      .catch((err: Error) => active && setError(errorMessage(err, "Error al cargar los integrantes.")))
      .finally(() => active && setLoadingMembers(false));
    return () => {
      active = false;
    };
  }, [selectedPlayId]);

  const selectedPlay = plays.find((p) => p.id === selectedPlayId);
  const rows = React.useMemo(() => members.map(toRow), [members]);

  function handleExport() {
    if (!selectedPlay) return;
    const filename = `Justificantes-${selectedPlay.titulo.replace(/\s+/g, "_")}`;
    exportToExcel(rows, EXPORT_COLUMNS, filename, "Justificantes");
  }

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stage/10 text-stage">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">
              Justificantes escolares
            </h1>
            <p className="text-sm text-muted-foreground">
              Datos académicos de los estudiantes inscritos en una obra.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Obra
            </label>
            <Select
              value={selectedPlayId}
              onChange={(e) => setSelectedPlayId(e.target.value)}
              className="h-9 w-64"
            >
              {plays.length === 0 && <option value="">Sin obras</option>}
              {plays.map((play) => (
                <option key={play.id} value={play.id}>
                  {play.titulo}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={handleExport}
            disabled={rows.length === 0}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button
            variant="outline"
            onClick={printView}
            disabled={rows.length === 0}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader className="print-header">
          <CardTitle>
            {selectedPlay
              ? `Elenco: ${selectedPlay.titulo}`
              : "Selecciona una obra"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <FullPageSpinner label="Cargando integrantes..." />
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No hay estudiantes inscritos en esta obra.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {EXPORT_COLUMNS.map((col) => (
                    <TableHead key={col.header}>{col.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={`${row.correo}-${index}`}>
                    {EXPORT_COLUMNS.map((col) => (
                      <TableCell key={col.header}>
                        {col.value(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
