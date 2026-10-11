import * as React from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ui/dialog";
import {
  objectPathFromStored,
  removeScript,
  resolveScriptUrl,
  scriptFileName,
  updatePlay,
  uploadScript,
} from "@/services";
import { errorMessage } from "@/lib/utils";
import type { PlayWithRelations } from "@/types";

interface ScriptTabProps {
  play: PlayWithRelations;
  canManage: boolean;
  onSaved: () => void;
}

export function ScriptTab({ play, canManage, onSaved }: ScriptTabProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("El guion debe ser un archivo PDF.");
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const { path } = await uploadScript(play.id, file);
      await updatePlay(play.id, { guion_url: path });
      setSuccess("Guion cargado correctamente.");
      onSaved();
    } catch (err) {
      setError(errorMessage(err, "No se pudo subir el guion."));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleView() {
    if (!play.guion_url) return;
    try {
      const url = await resolveScriptUrl(play.guion_url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(errorMessage(err, "No se pudo abrir el guion."));
    }
  }

  async function confirmRemove() {
    if (!play.guion_url) return;
    setBusy(true);
    try {
      await removeScript(objectPathFromStored(play.guion_url));
      await updatePlay(play.id, { guion_url: null });
      setSuccess("Guion eliminado.");
      onSaved();
    } catch (err) {
      setError(errorMessage(err, "No se pudo eliminar."));
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Guion de la obra</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {play.guion_url ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-stage/10 text-stage">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium">Guion actual (PDF)</p>
                <p className="max-w-xs truncate text-xs text-muted-foreground">
                  {scriptFileName(play.guion_url)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleView}>
                Ver guion
              </Button>
              {canManage && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  disabled={busy}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Alert variant="info" title="Sin guion cargado">
            {canManage
              ? "Sube el archivo PDF del guion para que el elenco pueda descargarlo."
              : "El director aún no ha subido el guion de esta obra."}
          </Alert>
        )}

        {canManage && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {play.guion_url ? "Reemplazar guion" : "Subir guion PDF"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Formato permitido: PDF. Bucket: scripts-guiones
            </p>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmRemove}
        loading={busy}
        title="Eliminar guion"
        description="Se eliminará el archivo del almacenamiento y se desvinculará de la obra. Esta acción no se puede deshacer."
        confirmLabel="Eliminar guion"
      />
    </Card>
  );
}
