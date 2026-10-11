import * as React from "react";
import { BookOpen, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { FullPageSpinner } from "@/components/ui/spinner";
import { PlayCard } from "@/components/PlayCard";
import { listActorPlays, resolveScriptUrl, type ActorPlay } from "@/services";
import { errorMessage } from "@/lib/utils";
import type { Profile, PlayWithRelations } from "@/types";

export function ActorDashboard({ profile }: { profile: Profile }) {
  const [entries, setEntries] = React.useState<ActorPlay[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    listActorPlays(profile.id)
      .then((data) => active && setEntries(data))
      .catch((err: Error) => active && setError(errorMessage(err, "Error al cargar las obras.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [profile.id]);

  async function handleDownload(play: PlayWithRelations) {
    if (!play.guion_url) return;
    setDownloadError(null);
    try {
      const url = await resolveScriptUrl(play.guion_url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setDownloadError(errorMessage(err, "No se pudo abrir el guion."));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Mis obras</h1>
        <p className="text-sm text-muted-foreground">
          Producciones en las que participas y tu rol en cada una.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {downloadError && <Alert variant="error">{downloadError}</Alert>}

      {loading ? (
        <FullPageSpinner />
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Todavía no has sido asignado a ninguna obra. Contacta a tu
              director.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map(({ play, rolTeatral }) => (
            <PlayCard
              key={play.id}
              play={play}
              theatricalRole={rolTeatral}
              detailPath={`/mis-obras/${play.id}`}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Download className="h-3.5 w-3.5" />
        El botón de guion descarga/abre el PDF subido por tu director.
      </p>
    </div>
  );
}
