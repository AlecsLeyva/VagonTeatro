import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { FullPageSpinner } from "@/components/ui/spinner";
import { PlayCard } from "@/components/PlayCard";
import { CreatePlayDialog } from "@/components/plays/CreatePlayDialog";
import { MAX_ACTIVE_PLAYS } from "@/lib/supabaseClient";
import { countMembersByPlay, listPlaysForProfile } from "@/services";
import { errorMessage } from "@/lib/utils";
import type { PlayWithRelations, Profile } from "@/types";

export function DirectorDashboard({ profile }: { profile: Profile }) {
  const [plays, setPlays] = React.useState<PlayWithRelations[]>([]);
  const [memberCounts, setMemberCounts] = React.useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await listPlaysForProfile(profile);
      setPlays(list);
      setMemberCounts(await countMembersByPlay(list.map((play) => play.id)));
      setError(null);
    } catch (err) {
      setError(errorMessage(err, "Error al cargar las obras."));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const activeCount = plays.filter((play) => play.estado === "activa").length;
  const limitReached = activeCount >= MAX_ACTIVE_PLAYS;
  const isDirector = profile.rol === "director";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {isDirector ? "Mis obras" : "Obras asignadas"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isDirector
              ? "Gestiona tus producciones y su elenco."
              : "Obras donde participas como subdirector."}
          </p>
        </div>
        {isDirector && (
          <Button
            className="gap-2"
            onClick={() => setDialogOpen(true)}
            disabled={limitReached}
          >
            <Plus className="h-4 w-4" />
            Nueva obra
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Obras activas</span>
            <Badge variant={limitReached ? "danger" : "success"}>
              {activeCount} / {MAX_ACTIVE_PLAYS}
            </Badge>
          </div>
          <div className="flex h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-stage via-stage-light to-stage-gold shadow-warm-sm transition-all"
              style={{
                width: `${Math.min((activeCount / MAX_ACTIVE_PLAYS) * 100, 100)}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {limitReached && (
        <Alert variant="warning" title="Has alcanzado el límite de obras activas">
          Tienes {MAX_ACTIVE_PLAYS} obras activas. Finaliza o pausa alguna para
          poder registrar una nueva producción.
        </Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <FullPageSpinner />
      ) : plays.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no tienes obras registradas.
            </p>
            {isDirector && (
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear mi primera obra
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {plays.map((play) => (
            <PlayCard
              key={play.id}
              play={play}
              memberCount={memberCounts[play.id] ?? 0}
              canManage
            />
          ))}
        </div>
      )}

      <CreatePlayDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        directorId={profile.id}
        onCreated={load}
      />
    </div>
  );
}
