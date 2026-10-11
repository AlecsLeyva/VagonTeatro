import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Spinner, FullPageSpinner } from "@/components/ui/spinner";
import { AuthShell } from "@/pages/LoginPage";
import { errorMessage } from "@/lib/utils";

export function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    try {
      await updatePassword(password);
      setDone(true);
      window.setTimeout(() => navigate("/dashboard", { replace: true }), 1600);
    } catch (err) {
      setError(errorMessage(err, "No se pudo actualizar la contraseña."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <FullPageSpinner label="Validando el enlace..." />;

  if (!session) {
    return (
      <AuthShell
        title="Enlace inválido o expirado"
        subtitle="El enlace de recuperación ya no es válido. Solicita uno nuevo."
      >
        <div className="space-y-4">
          <Alert variant="warning">
            No pudimos validar tu enlace de recuperación. Es posible que ya se
            haya usado o que haya expirado.
          </Alert>
          <Button asChild size="lg" className="w-full">
            <Link to="/forgot-password">Solicitar un nuevo enlace</Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell
        title="Contraseña actualizada"
        subtitle="Ya puedes usar tu nueva contraseña."
      >
        <Alert variant="success" title="Listo">
          Tu contraseña se cambió correctamente. Te estamos redirigiendo...
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nueva contraseña"
      subtitle="Define una contraseña nueva para tu cuenta."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <div className="space-y-2">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            leadingIcon={<Lock />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            leadingIcon={<ShieldCheck />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="********"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving && <Spinner className="h-4 w-4" />}
          Guardar contraseña
        </Button>
      </form>
    </AuthShell>
  );
}
