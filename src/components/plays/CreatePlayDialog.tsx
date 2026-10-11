import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/AuthContext";
import { createPlay, isActivePlaysLimitError, listProfiles } from "@/services";
import { errorMessage } from "@/lib/utils";
import { serializeDias, type DiasValue } from "@/lib/dias";
import { DiasPicker } from "./DiasPicker";
import type { Profile } from "@/types";

interface CreatePlayDialogProps {
  open: boolean;
  onClose: () => void;
  directorId: string;
  onCreated: () => void;
}

export function CreatePlayDialog({
  open,
  onClose,
  directorId,
  onCreated,
}: CreatePlayDialogProps) {
  const [titulo, setTitulo] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [dias, setDias] = React.useState<DiasValue>({
    days: [],
    start: "",
    end: "",
  });
  const [subdirectorId, setSubdirectorId] = React.useState<string>("");
  const [subdirectors, setSubdirectors] = React.useState<Profile[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [limitReached, setLimitReached] = React.useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setLimitReached(false);
    listProfiles()
      .then((profiles) =>
        setSubdirectors(profiles.filter((p) => p.rol === "subdirector")),
      )
      .catch(() => setSubdirectors([]));
  }, [open]);

  function reset() {
    setTitulo("");
    setDescripcion("");
    setDias({ days: [], start: "", end: "" });
    setSubdirectorId("");
  }

  async function handleCreate() {
    if (!titulo.trim()) {
      setError("El título es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createPlay({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        director_id: user?.id ?? directorId,
        subdirector_id: subdirectorId || null,
        dias_asignados: serializeDias(dias) || null,
        utileria: null,
        estado: "activa",
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      if (
        isActivePlaysLimitError(
          err as { message?: string; details?: string; code?: string },
        )
      ) {
        setLimitReached(true);
      } else {
        const message = errorMessage(err, "No se pudo crear la obra.");
        const isPermissionError =
          (err as { code?: string })?.code === "42501" ||
          /row-level security|permission denied/i.test(message);
        setError(
          isPermissionError
            ? `${message}\n\nNo tienes permiso para crear obras. Verifica que tu cuenta tenga el rol "director" y que las políticas de seguridad (RLS) de tu proyecto Supabase estén aplicadas.`
            : message,
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
        title={limitReached ? "Límite de obras alcanzado" : "Nueva obra"}

      description={
        limitReached
          ? undefined
          : "Registra una nueva obra de teatro. Solo puedes tener 5 obras activas."
      }
      footer={
        limitReached ? (
          <Button onClick={onClose}>Entendido</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />}
              Crear obra
            </Button>
          </>
        )
      }
    >
      {limitReached ? (
          <Alert variant="warning" title="No puedes crear más obras activas">
            Ya tienes 5 obras activas simultáneas, que es el máximo permitido por

          la plataforma. Finaliza o pausa una obra existente antes de crear una
          nueva.
        </Alert>
      ) : (
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título de la obra</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="La Casa de Bernarda Alba"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Sinopsis breve de la obra..."
            />
          </div>
          <div className="space-y-2">
            <Label>Días de ensayo (lunes a jueves)</Label>
            <DiasPicker value={dias} onChange={setDias} disabled={saving} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subdirector">Subdirector (opcional)</Label>
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
        </div>
      )}
    </Dialog>
  );
}
