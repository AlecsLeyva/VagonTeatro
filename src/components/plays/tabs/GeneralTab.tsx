import * as React from "react";
import { Save } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { listProfiles, updatePlay } from "@/services";
import { errorMessage } from "@/lib/utils";
import { parseDias, serializeDias, type DiasValue } from "@/lib/dias";
import { DiasPicker } from "@/components/plays/DiasPicker";
import type { PlayStatus, PlayWithRelations, Profile } from "@/types";

interface GeneralTabProps {
  play: PlayWithRelations;
  profile: Profile;
  onSaved: () => void;
}

export function GeneralTab({ play, profile, onSaved }: GeneralTabProps) {
  const [titulo, setTitulo] = React.useState(play.titulo);
  const [descripcion, setDescripcion] = React.useState(play.descripcion ?? "");
  const [dias, setDias] = React.useState<DiasValue>(() =>
    parseDias(play.dias_asignados),
  );
  const [utileria, setUtileria] = React.useState(play.utileria ?? "");
  const [estado, setEstado] = React.useState<PlayStatus>(play.estado);
  const [subdirectorId, setSubdirectorId] = React.useState(
    play.subdirector_id ?? "",
  );
  const [subdirectors, setSubdirectors] = React.useState<Profile[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    listProfiles()
      .then((people) => {
        const assignable = people.filter(
          (p) => p.rol === "subdirector" || p.rol === "actor",
        );
        const current = people.find((p) => p.id === play.subdirector_id);
        if (current && !assignable.some((p) => p.id === current.id)) {
          assignable.push(current);
        }
        setSubdirectors(assignable);
      })
      .catch(() => setSubdirectors([]));
  }, [play.subdirector_id]);

  const canEdit =
    profile.rol === "admin" ||
    profile.rol === "director" ||
    profile.id === play.subdirector_id;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updatePlay(play.id, {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        dias_asignados: serializeDias(dias) || null,
        utileria: utileria.trim() || null,
        estado,
        subdirector_id: subdirectorId || null,
      });
      setSaved(true);
      onSaved();
    } catch (err) {
      setError(errorMessage(err, "No se pudieron guardar los cambios."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            {saved && <Alert variant="success">Cambios guardados.</Alert>}
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción / sinopsis</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label>Días y horarios asignados (lunes a jueves)</Label>
              <DiasPicker value={dias} onChange={setDias} disabled={!canEdit} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                id="estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value as PlayStatus)}
                disabled={!canEdit}
              >
                <option value="activa">Activa</option>
                <option value="pausada">Pausada</option>
                <option value="finalizada">Finalizada</option>
              </Select>
            </div>
            {profile.rol === "director" || profile.rol === "admin" ? (
              <div className="space-y-2">
                <Label htmlFor="subdirector">Subdirector</Label>
                <Select
                  id="subdirector"
                  value={subdirectorId}
                  onChange={(e) => setSubdirectorId(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {subdirectors.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.nombre}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            {canEdit && (
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Notas de utilería</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={utileria}
            onChange={(e) => setUtileria(e.target.value)}
              placeholder="Vestuario, escenografía, objetos, etc."

            className="min-h-[220px]"
            disabled={!canEdit}
          />
          {canEdit && (
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="outline"
              className="w-full gap-2"
            >
              <Save className="h-4 w-4" />
              Guardar utilería
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
