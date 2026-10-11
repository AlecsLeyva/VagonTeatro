import * as React from "react";
import { Search, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { listProfiles, updateUserRole } from "@/services";
import { errorMessage, matchesText, ROLE_LABELS } from "@/lib/utils";
import type { Profile, UserRole } from "@/types";

const ROLES: UserRole[] = ["admin", "director", "subdirector", "actor"];

export function AdminUsersPage() {
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    listProfiles()
      .then(setProfiles)
      .catch((err: Error) => setError(errorMessage(err, "Error al cargar los usuarios.")))
      .finally(() => setLoading(false));
  }, []);

  async function handleRoleChange(userId: string, rol: UserRole) {
    setSavingId(userId);
    setError(null);
    try {
      await updateUserRole(userId, rol);
      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, rol } : p)),
      );
    } catch (err) {
      setError(errorMessage(err, "No se pudo actualizar el rol."));
    } finally {
      setSavingId(null);
    }
  }

  const filtered = profiles.filter((p) =>
    matchesText(search, p.nombre, p.correo, p.grupo),
  );

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stage/10 text-stage">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">Gestión de usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Asigna y modifica los roles de todos los usuarios de la plataforma.
          </p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">
            {profiles.length} usuarios registrados
          </CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo o grupo..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Carrera / Grupo</TableHead>
                <TableHead>Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.correo}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {person.carrera ?? "—"}
                    {person.grupo ? ` · ${person.grupo}` : ""}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={person.rol}
                      disabled={savingId === person.id}
                      onChange={(e) =>
                        handleRoleChange(person.id, e.target.value as UserRole)
                      }
                      className="h-9 w-44"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
