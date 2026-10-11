import * as React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Clapperboard,
  Users,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleBadge } from "@/components/layout/RoleBadge";
import { FullPageSpinner } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import {
  countByRole,
  listPlaysForProfile,
  listProfiles,
} from "@/services";
import type { PlayWithRelations, Profile } from "@/types";
import { errorMessage, ROLE_LABELS } from "@/lib/utils";

const STATUS_VARIANTS = {
  activa: "success",
  pausada: "warning",
  finalizada: "secondary",
} as const;

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-warm-sm ring-1 ring-inset ring-black/5 ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard({ profile }: { profile: Profile }) {
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [plays, setPlays] = React.useState<PlayWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    Promise.all([listProfiles(), listPlaysForProfile(profile)])
      .then(([people, allPlays]) => {
        if (!active) return;
        setProfiles(people);
        setPlays(allPlays);
      })
      .catch((err: Error) => active && setError(errorMessage(err, "Error al cargar el panel.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profile]);

  if (loading) return <FullPageSpinner />;

  const counts = countByRole(profiles);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Panel de administración</h1>
        <p className="text-sm text-muted-foreground">
          Visión general de la plataforma VagonTeatro.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Clapperboard}
          label="Obras registradas"
          value={plays.length}
          accent="bg-stage/10 text-stage"
        />
        <MetricCard
          icon={Users}
          label="Actores / Staff"
          value={counts.actor}
          accent="bg-emerald-100 text-emerald-700"
        />
        <MetricCard
          icon={BookOpen}
          label="Directores"
          value={counts.director}
          accent="bg-amber-100 text-amber-700"
        />
        <MetricCard
          icon={UserCheck}
          label="Subdirectores"
          value={counts.subdirector}
          accent="bg-sky-100 text-sky-700"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Usuarios recientes</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/usuarios">Gestionar usuarios</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.slice(0, 6).map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.correo}
                  </TableCell>
                  <TableCell>
                    <RoleBadge rol={person.rol} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todas las obras</CardTitle>
        </CardHeader>
        <CardContent>
          {plays.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aún no hay obras registradas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Director</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plays.map((play) => (
                  <TableRow key={play.id}>
                    <TableCell className="font-medium">{play.titulo}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {play.director?.nombre ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[play.estado]}>
                        {play.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/obras/${play.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="sr-only">{ROLE_LABELS.admin}</p>
    </div>
  );
}
