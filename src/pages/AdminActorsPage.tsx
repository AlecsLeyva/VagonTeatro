import * as React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CalendarClock,
  FileDown,
  Printer,
  Search,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FullPageSpinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  assignPlaySubdirector,
  listCastOverview,
  listProfiles,
} from "@/services";
import type { CastOverviewRow } from "@/services";
import type { Profile, TheatricalRole } from "@/types";
import {
  errorMessage,
  matchesText,
  THEATRICAL_ROLE_LABELS,
} from "@/lib/utils";
import { parseDias } from "@/lib/dias";
import { hasScheduleConflict } from "@/lib/schedule";
import { exportToExcel, printView, type ExportColumn } from "@/lib/export";

const THEATRICAL_ROLES: TheatricalRole[] = ["principal", "suplente", "staff"];

type RoleFilter = "todos" | TheatricalRole;

type PlayCountFilter = "todas" | "sin-obra" | "hasta-2" | "3-mas";

interface PlayGroup {
  playId: string;
  playTitulo: string;
  playDirectorId: string;
  playSubdirectorId: string | null;
  playDiasAsignados: string | null;
  rows: CastOverviewRow[];
}

interface ActorUserRow {
  profile: Profile;
  assignments: CastOverviewRow[];
  hasConflict: boolean;
}

function formatPlayDays(value: string | null | undefined): string {
  const { days, start, end } = parseDias(value);
  if (days.length === 0) return "";
  const label = days
    .map((key) => key.charAt(0).toUpperCase() + key.slice(1))
    .join(", ");
  return start && end ? `${label} · ${start}-${end}` : label;
}

export function AdminActorsPage() {
  const { profile } = useAuth();
  const [cast, setCast] = React.useState<CastOverviewRow[]>([]);
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<RoleFilter>("todos");
  const [playCountFilter, setPlayCountFilter] =
    React.useState<PlayCountFilter>("todas");
  const [tab, setTab] = React.useState("obras");
  const [savingPlayId, setSavingPlayId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    Promise.allSettled([listCastOverview(), listProfiles()]).then((results) => {
      if (!active) return;
      const [castResult, profilesResult] = results;
      if (castResult.status === "fulfilled") {
        setCast(castResult.value);
      } else {
        setError(errorMessage(castResult.reason, "Error al cargar el elenco."));
      }
      if (profilesResult.status === "fulfilled") {
        setProfiles(profilesResult.value);
      } else {
        setError((prev) =>
          prev ??
          errorMessage(profilesResult.reason, "Error al cargar los usuarios."),
        );
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const matchesSearch = React.useCallback(
    (row: CastOverviewRow) =>
      matchesText(
        search,
        row.profile?.nombre,
        row.profile?.correo,
        row.profile?.carrera,
        row.profile?.grupo,
        row.playTitulo,
      ),
    [search],
  );

  const filteredCast = React.useMemo(
    () =>
      cast.filter(
        (row) =>
          matchesSearch(row) &&
          (roleFilter === "todos" || row.rol_teatral === roleFilter),
      ),
    [cast, matchesSearch, roleFilter],
  );

  const profileById = React.useMemo(
    () => new Map(profiles.map((person) => [person.id, person])),
    [profiles],
  );

  const membersByPlay = React.useMemo(() => {
    const map = new Map<string, CastOverviewRow[]>();
    for (const row of cast) {
      const list = map.get(row.playId) ?? [];
      list.push(row);
      map.set(row.playId, list);
    }
    return map;
  }, [cast]);

  const groupedByPlay = React.useMemo(() => {
    const map = new Map<string, PlayGroup>();
    for (const row of filteredCast) {
      const entry = map.get(row.playId) ?? {
        playId: row.playId,
        playTitulo: row.playTitulo,
        playDirectorId: row.playDirectorId,
        playSubdirectorId: row.playSubdirectorId,
        playDiasAsignados: row.playDiasAsignados,
        rows: [],
      };
      entry.rows.push(row);
      map.set(row.playId, entry);
    }
    return Array.from(map.values());
  }, [filteredCast]);

  function canManagePlay(group: PlayGroup): boolean {
    if (!profile) return false;
    return (
      profile.rol === "admin" ||
      (profile.rol === "director" && group.playDirectorId === profile.id)
    );
  }

  function subdirectorCandidates(
    playId: string,
    currentSubdirectorId: string | null,
  ): Profile[] {
    const seen = new Map<string, Profile>();
    for (const row of membersByPlay.get(playId) ?? []) {
      if (row.profile && (row.profile.rol === "actor" || row.profile.rol === "subdirector")) {
        seen.set(row.profile.id, row.profile);
      }
    }
    if (
      currentSubdirectorId &&
      !seen.has(currentSubdirectorId) &&
      profileById.has(currentSubdirectorId)
    ) {
      seen.set(currentSubdirectorId, profileById.get(currentSubdirectorId)!);
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }

  async function handleSubdirectorChange(playId: string, subdirectorId: string) {
    setSavingPlayId(playId);
    setError(null);
    try {
      await assignPlaySubdirector(playId, subdirectorId || null);
      setCast((prev) =>
        prev.map((row) =>
          row.playId === playId
            ? { ...row, playSubdirectorId: subdirectorId || null }
            : row,
        ),
      );
    } catch (err) {
      setError(errorMessage(err, "No se pudo asignar el subdirector."));
    } finally {
      setSavingPlayId(null);
    }
  }

  const actorUsers = React.useMemo<ActorUserRow[]>(() => {
    const people = new Map<string, Profile>();
    for (const person of profiles) {
      if (person.rol === "actor") people.set(person.id, person);
    }
    for (const row of cast) {
      if (row.profile) people.set(row.profile.id, row.profile);
    }
    return Array.from(people.values())
      .map((person) => {
        const assignments = cast.filter((row) => row.profile?.id === person.id);
        return {
          profile: person,
          assignments,
          hasConflict: assignments.some((assignment) =>
            hasScheduleConflict(
              assignment.playDiasAsignados,
              person.horario_clases,
            ),
          ),
        };
      })
      .filter(({ profile, assignments }) => {
        const hit = matchesText(
          search,
          profile.nombre,
          profile.correo,
          profile.carrera,
          profile.grupo,
          ...assignments.map((assignment) => assignment.playTitulo),
        );
        if (!hit) return false;
        if (roleFilter !== "todos") {
          if (!assignments.some((a) => a.rol_teatral === roleFilter)) {
            return false;
          }
        }
        const count = assignments.length;
        if (playCountFilter === "sin-obra" && count !== 0) return false;
        if (playCountFilter === "hasta-2" && count > 2) return false;
        if (playCountFilter === "3-mas" && count < 3) return false;
        return true;
      })
      .sort((a, b) => a.profile.nombre.localeCompare(b.profile.nombre));
  }, [profiles, cast, search, roleFilter, playCountFilter]);

  const exportColumns = React.useMemo<ExportColumn<ActorUserRow>[]>(
    () => [
      { header: "Nombre", value: (row) => row.profile.nombre },
      { header: "Correo", value: (row) => row.profile.correo },
      { header: "Carrera", value: (row) => row.profile.carrera ?? "—" },
      { header: "Grupo", value: (row) => row.profile.grupo ?? "—" },
      { header: "Obras", value: (row) => row.assignments.length },
      {
        header: "Obras y rol",
        value: (row) =>
          row.assignments
            .map(
              (assignment) =>
                `${assignment.playTitulo} (${THEATRICAL_ROLE_LABELS[assignment.rol_teatral]})`,
            )
            .join(", ") || "Sin obra asignada",
      },
      {
        header: "Horario de clases",
        value: (row) => row.profile.horario_clases?.trim() || "Sin horario registrado",
      },
      {
        header: "Choque de horario",
        value: (row) => (row.hasConflict ? "Posible choque" : "Sin choque"),
      },
    ],
    [],
  );

  function handleExport() {
    exportToExcel(actorUsers, exportColumns, "Actores-y-horarios", "Actores");
  }

  if (loading) return <FullPageSpinner />;

  const castCount = groupedByPlay.reduce(
    (total, group) => total + group.rows.length,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stage/10 text-stage">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">
              Actores y horarios
            </h1>
            <p className="text-sm text-muted-foreground">
              Consulta a los integrantes del elenco y sus horarios de clases.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={actorUsers.length === 0}
          >
            <FileDown className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={printView}
            disabled={actorUsers.length === 0}
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card className="no-print">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo, carrera u obra..."
              leadingIcon={<Search />}
            />
          </div>
          <div className="sm:w-56">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            >
              <option value="todos">Todos los roles teatrales</option>
              {THEATRICAL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {THEATRICAL_ROLE_LABELS[role]}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="obras">
            Elenco por obra ({castCount})
          </TabsTrigger>
          <TabsTrigger value="integrantes">
            Actores y horarios ({actorUsers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="obras" className="space-y-4">
          {groupedByPlay.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No se encontraron integrantes con los filtros actuales.
              </CardContent>
            </Card>
          ) : (
            groupedByPlay.map((group) => (
              <Card key={group.playId}>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {group.playTitulo}
                    </CardTitle>
                    {formatPlayDays(group.playDiasAsignados) && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Ensayos: {formatPlayDays(group.playDiasAsignados)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 no-print">
                    {canManagePlay(group) && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Subdirector
                        </span>
                        <Select
                          value={group.playSubdirectorId ?? ""}
                          disabled={savingPlayId === group.playId}
                          onChange={(e) =>
                            handleSubdirectorChange(group.playId, e.target.value)
                          }
                          className="h-9 w-52"
                        >
                          <option value="">Sin asignar</option>
                          {subdirectorCandidates(
                            group.playId,
                            group.playSubdirectorId,
                          ).map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.nombre}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/obras/${group.playId}`}>Ver obra</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Carrera / Grupo</TableHead>
                        <TableHead>Rol teatral</TableHead>
                        <TableHead>Horario de clases</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.rows.map((row) => (
                        <TableRow key={row.memberId}>
                          <TableCell className="font-medium">
                            {row.profile?.nombre ?? "Usuario"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.profile?.carrera ?? "—"}
                            {row.profile?.grupo
                              ? ` · ${row.profile.grupo}`
                              : ""}
                          </TableCell>
                          <TableCell>
                            <Badge variant="gold">
                              {THEATRICAL_ROLE_LABELS[row.rol_teatral]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="space-y-1">
                              <span>
                                {row.profile?.horario_clases?.trim()
                                  ? row.profile.horario_clases
                                  : "Sin horario registrado"}
                              </span>
                              {hasScheduleConflict(
                                row.playDiasAsignados,
                                row.profile?.horario_clases,
                              ) && (
                                <Badge
                                  variant="warning"
                                  className="flex w-fit items-center gap-1"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  Posible choque con ensayo
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="integrantes">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">
                Actores y sus horarios ({actorUsers.length})
              </CardTitle>
              <div className="w-full sm:w-56 no-print">
                <Select
                  value={playCountFilter}
                  onChange={(e) =>
                    setPlayCountFilter(e.target.value as PlayCountFilter)
                  }
                >
                  <option value="todas">Todas las cargas</option>
                  <option value="sin-obra">Sin obra asignada</option>
                  <option value="hasta-2">Hasta 2 obras</option>
                  <option value="3-mas">3 obras o más</option>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {actorUsers.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No se encontraron actores con los filtros actuales.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Carrera / Grupo</TableHead>
                      <TableHead>Obras</TableHead>
                      <TableHead>Obras y rol</TableHead>
                      <TableHead>Horario de clases</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actorUsers.map(({ profile, assignments, hasConflict }) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.nombre}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {profile.correo}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {profile.carrera ?? "—"}
                          {profile.grupo ? ` · ${profile.grupo}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignments.length === 0 ? "secondary" : "outline"
                            }
                          >
                            {assignments.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {assignments.length === 0 ? (
                            <span className="text-muted-foreground">
                              Sin obra asignada
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {assignments.map((assignment) => (
                                <span
                                  key={assignment.memberId}
                                  className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background/60 px-2.5 py-0.5 text-xs font-medium"
                                >
                                  {assignment.playTitulo}
                                  <span className="text-muted-foreground">
                                    ·{" "}
                                    {
                                      THEATRICAL_ROLE_LABELS[
                                        assignment.rol_teatral
                                      ]
                                    }
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="space-y-1">
                            <span>
                              {profile.horario_clases?.trim()
                                ? profile.horario_clases
                                : "Sin horario registrado"}
                            </span>
                            {hasConflict && (
                              <Badge
                                variant="warning"
                                className="flex w-fit items-center gap-1"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                Posible choque de horario
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
