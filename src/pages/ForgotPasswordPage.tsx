import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AuthShell } from "@/pages/LoginPage";
import { errorMessage } from "@/lib/utils";

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [correo, setCorreo] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(correo.trim());
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, "No se pudo enviar el correo de recuperación."));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Revisa tu correo"
        subtitle="Te enviamos un enlace para restablecer tu contraseña."
      >
        <div className="space-y-4">
          <Alert variant="success" title="Enlace enviado">
            Si <span className="font-semibold">{correo.trim()}</span> está
            registrado, recibirás un enlace para restablecer tu contraseña.
            Recuerda revisar la carpeta de spam.
          </Alert>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/login">
              <ArrowLeft className="h-4 w-4" />
              Volver a iniciar sesión
            </Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Escribe tu correo y te enviaremos un enlace para restablecerla."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <div className="space-y-2">
          <Label htmlFor="correo">Correo electrónico</Label>
          <Input
            id="correo"
            type="email"
            autoComplete="email"
            required
            leadingIcon={<Mail />}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tu.correo@universidad.edu.mx"
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Spinner className="h-4 w-4" />}
          Enviar enlace de recuperación
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-stage hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthShell>
  );
}
