import * as React from "react";
import { UserPlus, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  addPlayMember,
  listProfiles,
  removePlayMember,
  updatePlayMember,
} from "@/services";
import type {
  PlayMemberWithProfile,
  Profile,
  TheatricalRole,
} from "@/types";
import { errorMessage, THEATRICAL_ROLE_LABELS } from "@/lib/utils";

interface CastTabProps {
  playId: string;
  members: PlayMemberWithProfile[];
  canManage: boolean;
  onChanged: () => void;
}

const ROLE_OPTIONS: TheatricalRole[] = ["principal", "suplente", "staff"];

export function CastTab({ playId, members, canManage, onChanged }: CastTabProps) {
  const [candidates, setCandidates] = React.useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = React.useState("");
  const [selectedRole, setSelectedRole] =
    React.useState<TheatricalRole>("principal");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [toRemove, setToRemove] = React.useState<PlayMemberWithProfile | null>(
    null,
  );

  React.useEffect(() => {
    if (!canManage) return;
    listProfiles()
      .then((people) =>
        setCandidates(people.filter((p) => p.rol !== "admin")),
      )
      .catch((err: Error) => setError(errorMessage(err, "No se pudieron cargar los usuarios.")));
  }, [canManage]);

  const memberIds = new Set(members.map((m) => m.user_id));
  const available = candidates.filter((c) => !memberIds.has(c.id));

  async function handleAdd() {
    if (!selectedUser) {
      setError("Selecciona un integrante.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addPlayMember(playId, selectedUser, selectedRole);
      setSelectedUser("");
      setSelectedRole("principal");
      onChanged();
    } catch (err) {
      const message = errorMessage(err, "No se pudo agregar al integrante.");
      setError(
        /duplicate|unique/i.test(message)
          ? "Ese integrante ya pertenece a la obra."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(memberId: string, role: TheatricalRole) {
    try {
      await updatePlayMember(memberId, role);
      onChanged();
    } catch (err) {
      setError(errorMessage(err, "No se pudo actualizar."));
    }
  }

  async function confirmRemove() {
    if (!toRemove) return;
    setBusy(true);
    try {
      await removePlayMember(toRemove.id);
      setToRemove(null);
      onChanged();
    } catch (err) {
      setError(errorMessage(err, "No se pudo eliminar."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agregar al elenco</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="member">Integrante</Label>
                <Select
                  id="member"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Selecciona una persona...</option>
                  {available.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.nombre} — {person.carrera ?? "sin carrera"}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 sm:w-44">
                <Label htmlFor="rolTeatral">Rol teatral</Label>
                <Select
                  id="rolTeatral"
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value as TheatricalRole)
                  }
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {THEATRICAL_ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              </div>
              <Button onClick={handleAdd} disabled={busy} className="gap-2">
                {busy ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Agregar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {canManage ? "Elenco actual" : "Compañeros de elenco"} ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canManage && error && <Alert variant="error">{error}</Alert>}
          {members.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aún no hay integrantes asignados a esta obra.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Carrera</TableHead>
                  <TableHead>Rol teatral</TableHead>
                  {canManage && (
                    <TableHead className="text-right">Acciones</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.profiles?.nombre ?? "Usuario"}
                      {member.profiles?.rol &&
                        member.profiles.rol !== "actor" && (
                          <Badge variant="outline" className="ml-2">
                            {member.profiles.rol}
                          </Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.profiles?.carrera ?? "—"}
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <Select
                          value={member.rol_teatral}
                          onChange={(e) =>
                            handleRoleChange(
                              member.id,
                              e.target.value as TheatricalRole,
                            )
                          }
                          className="h-9 w-40"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {THEATRICAL_ROLE_LABELS[role]}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Badge variant="gold">
                          {THEATRICAL_ROLE_LABELS[member.rol_teatral]}
                        </Badge>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToRemove(member)}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(toRemove)}
        onClose={() => setToRemove(null)}
        onConfirm={confirmRemove}
        loading={busy}
        title="Eliminar integrante"
        description={`¿Quitar a ${toRemove?.profiles?.nombre ?? "este integrante"} de la obra? Se perderán sus registros de asistencia asociados si el sistema los elimina en cascada.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
