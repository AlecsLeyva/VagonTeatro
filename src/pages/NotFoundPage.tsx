import { Link } from "react-router-dom";
import { Theater } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stage/10 text-stage">
        <Theater className="h-8 w-8" />
      </span>
      <h1 className="font-display text-3xl font-bold">Página no encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La página que buscas no existe o fue movida.
      </p>
      <Button asChild>
        <Link to="/dashboard">Volver al inicio</Link>
      </Button>
    </div>
  );
}
