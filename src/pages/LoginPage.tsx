import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Send, Sparkles, Theater } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/utils";

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { signIn, resendConfirmation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [unconfirmed, setUnconfirmed] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [resent, setResent] = React.useState(false);

  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? "/dashboard";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setUnconfirmed(false);
    setLoading(true);
    try {
      await signIn(correo.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo iniciar sesión";
      if (/not confirmed/i.test(message)) {
        setUnconfirmed(true);
        setError(
          "Debes confirmar tu correo electrónico antes de iniciar sesión.",
        );
      } else if (/invalid login/i.test(message)) {
        setError("Correo o contraseña incorrectos.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setResent(false);
    try {
      await resendConfirmation(correo.trim());
      setResent(true);
      setUnconfirmed(false);
    } catch (err) {
      setError(errorMessage(err, "No se pudo reenviar el correo de confirmación."));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title="Bienvenido de nuevo"
      subtitle="Inicia sesión para gestionar tus obras y tu elenco."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {resent && (
          <Alert variant="success">
            Te reenviamos el correo de confirmación. Revisa tu bandeja.
          </Alert>
        )}
        {unconfirmed && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={resending || !correo.trim()}
            onClick={handleResend}
          >
            {resending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            Reenviar correo de confirmación
          </Button>
        )}
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-stage hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            leadingIcon={<Lock />}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Spinner className="h-4 w-4" />}
          Entrar al escenario
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link to="/register" className="font-semibold text-stage hover:underline">
          Regístrate aquí
        </Link>
      </p>
    </AuthShell>
  );
}

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-stage-dark via-stage to-stage-dark lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-stage-gold to-transparent" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-stage-gold/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-[60%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(242,210,138,0.18),transparent_60%)]" />
        <div className="pointer-events-none absolute right-10 top-24 h-3 w-3 rounded-full bg-stage-gold/70" />
        <div className="pointer-events-none absolute right-24 top-40 h-2 w-2 rounded-full bg-white/40" />

        <div className="relative flex items-center gap-3 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-stage-gold/40">
            <Theater className="h-6 w-6" />
          </span>
          <span className="font-display text-2xl font-bold">
            Vagon<span className="gold-text">Teatro</span>
          </span>
        </div>

        <div className="relative max-w-md text-white">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Tu compañía de teatro, organizada en un solo lugar.
          </h2>
          <p className="mt-4 text-white/75">
            Gestiona obras, elencos, guiones y asistencias de forma simple y
            elegante.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/85">
            <li className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                <Sparkles className="h-3.5 w-3.5 text-stage-gold" />
              </span>
              Hasta 5 obras activas por director
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                <Sparkles className="h-3.5 w-3.5 text-stage-gold" />
              </span>
              Control de asistencia tipo hoja de cálculo
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                <Sparkles className="h-3.5 w-3.5 text-stage-gold" />
              </span>
              Justificantes escolares listos para exportar
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          VagonTeatro &middot; Sistema de gestión teatral universitaria
        </p>
      </div>

      {/* Panel de formulario */}
      <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-b from-muted/40 to-background p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-stage/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-stage-gold/10 blur-3xl" />
        <div className="relative w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-stage to-stage-light text-white shadow-warm shadow-stage/30 ring-1 ring-stage-gold/30">
              <Theater className="h-6 w-6" />
            </span>
            <span className="font-display text-2xl font-bold">
              Vagon<span className="text-stage">Teatro</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-bold">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          )}

          <div className="card-ambient mt-7 rounded-2xl border border-border/70 bg-card p-6 shadow-warm-lg shadow-stage/10 sm:p-7">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
