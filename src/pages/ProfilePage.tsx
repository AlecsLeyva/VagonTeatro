import * as React from "react";
import { Save, UserCircle } from "lucide-react";
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
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { RoleBadge } from "@/components/layout/RoleBadge";
import { useAuth } from "@/context/AuthContext";
import { updateOwnProfile } from "@/services";
import { errorMessage, TUTOR_TITLES } from "@/lib/utils";
import type { Profile, TutorTitle } from "@/types";

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = React.useState<Partial<Profile>>(profile ?? {});
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  if (!profile) return null;

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateOwnProfile(profile!.id, {
        nombre: form.nombre?.trim(),
        carrera: form.carrera || null,
        tutor_titulo: (form.tutor_titulo as TutorTitle) || null,
        tutor_nombre: form.tutor_nombre || null,
        grupo: form.grupo || null,
        horario_clases: form.horario_clases || null,
      });
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err, "No se pudo guardar el perfil."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-stage/10 text-stage">
          <UserCircle className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">Mi perfil</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <RoleBadge rol={profile.rol} />
            <span>{profile.correo}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos personales y académicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            {saved && <Alert variant="success">Perfil actualizado.</Alert>}

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                value={form.nombre ?? ""}
                onChange={(e) => set("nombre", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrera">Carrera</Label>
              <Input
                id="carrera"
                value={form.carrera ?? ""}
                onChange={(e) => set("carrera", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tutor_titulo">Título del tutor</Label>
                <Select
                  id="tutor_titulo"
                  value={form.tutor_titulo ?? ""}
                  onChange={(e) =>
                    set("tutor_titulo", e.target.value as TutorTitle)
                  }
                >
                  <option value="">Sin especificar</option>
                  {TUTOR_TITLES.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tutor_nombre">Nombre del tutor</Label>
                <Input
                  id="tutor_nombre"
                  value={form.tutor_nombre ?? ""}
                  onChange={(e) => set("tutor_nombre", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grupo">Grupo</Label>
                <Input
                  id="grupo"
                  value={form.grupo ?? ""}
                  onChange={(e) => set("grupo", e.target.value)}
                  placeholder="IDSW-41"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horario_clases">Horario de clases</Label>
                <Input
                  id="horario_clases"
                  value={form.horario_clases ?? ""}
                  onChange={(e) => set("horario_clases", e.target.value)}
                  placeholder="L-V 07:00 - 13:00"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
