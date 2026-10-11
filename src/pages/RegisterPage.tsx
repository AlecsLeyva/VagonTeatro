import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clapperboard,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { AuthShell } from "./LoginPage";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "actor",
    label: "Actor / Staff",
    description: "Actúa o da apoyo en las obras",
    icon: Users,
  },
  {
    value: "subdirector",
    label: "Subdirector",
    description: "Apoya la gestión de obras",
    icon: UserCog,
  },
  {
    value: "director",
    label: "Director",
    description: "Crea y dirige obras",
    icon: Clapperboard,
  },
];

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = React.useState("");
  const [correo, setCorreo] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rol, setRol] = React.useState<UserRole>("actor");

  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const { needsConfirmation } = await signUp({
        nombre: nombre.trim(),
        correo: correo.trim(),
        password,
        rol,
      });

      if (needsConfirmation) {
        setNotice(
          "Registro exitoso. Revisa tu correo para confirmar la cuenta antes de iniciar sesión.",
        );
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo completar el registro";
      setError(
        /already registered/i.test(message)
          ? "Este correo ya está registrado."
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Únete a la compañía de teatro de tu universidad en segundos."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre completo</Label>
          <Input
            id="nombre"
            required
            leadingIcon={<User />}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ana María López Hernández"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="correo">Correo electrónico</Label>
          <Input
            id="correo"
            type="email"
            required
            leadingIcon={<Mail />}
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="tu.correo@universidad.edu.mx"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              leadingIcon={<Lock />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              required
              leadingIcon={<Lock />}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
            />
          </div>
        </div>

        <div className="space-y-2">
            <Label id="rol-label">¿Cómo participarás?</Label>
          <div
            role="radiogroup"
            aria-labelledby="rol-label"
            className="grid gap-2 sm:grid-cols-3"
          >
            {ROLE_OPTIONS.map((option) => {
              const active = rol === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setRol(option.value)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all",
                    active
                      ? "border-stage bg-stage/5 ring-2 ring-stage/20"
                      : "border-border hover:border-stage/40 hover:bg-accent/50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      active
                        ? "bg-stage text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs text-sky-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Tus datos académicos (carrera, tutor, grupo y horario) podrás
            completarlos más adelante desde{" "}
            <span className="font-semibold">Mi perfil</span>.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Spinner className="h-4 w-4" />}
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-semibold text-stage hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
