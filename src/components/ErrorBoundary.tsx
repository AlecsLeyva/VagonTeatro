import * as React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Captura los errores de renderizado y evita que toda la aplicación quede en
 * blanco. Muestra un mensaje y un botón para recargar.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Error no controlado en la interfaz:", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">
            Algo salió mal
          </h1>
          <p className="text-sm text-muted-foreground">
            Ocurrió un error inesperado en la aplicación. Intenta recargar la
            página; si el problema persiste, contacta al administrador.
          </p>
          <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
          <Button onClick={this.handleReload} className="w-full">
            Recargar página
          </Button>
        </div>
      </div>
    );
  }
}
