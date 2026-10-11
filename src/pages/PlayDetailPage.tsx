import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { FullPageSpinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPlay, listPlayMembers } from "@/services";
import { errorMessage } from "@/lib/utils";
import type { PlayMemberWithProfile, PlayWithRelations } from "@/types";
import { GeneralTab } from "@/components/plays/tabs/GeneralTab";
import { CastTab } from "@/components/plays/tabs/CastTab";
import { ScriptTab } from "@/components/plays/tabs/ScriptTab";
import { AttendanceTab } from "@/components/plays/tabs/AttendanceTab";

const STATUS_VARIANTS = {
  activa: "success",
  pausada: "warning",
  finalizada: "secondary",
} as const;

export function PlayDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [play, setPlay] = React.useState<PlayWithRelations | null>(null);
  const [members, setMembers] = React.useState<PlayMemberWithProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!id) return;
    try {
      const [playData, memberData] = await Promise.all([
        getPlay(id),
        listPlayMembers(id),
      ]);
      setPlay(playData);
      setMembers(memberData);
      setError(null);
    } catch (err) {
      setError(errorMessage(err, "Error al cargar la obra."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  if (loading) return <FullPageSpinner label="Cargando obra..." />;

  if (error) return <Alert variant="error">{error}</Alert>;

  if (!play || !profile) {
    return (
      <div className="space-y-4">
        <Alert variant="warning" title="Obra no encontrada">
          La obra solicitada no existe o no tienes acceso a ella.
        </Alert>
        <Button asChild variant="outline">
          <Link to="/dashboard">Volver al inicio</Link>
        </Button>
      </div>
    );
  }

  const canManage =
    profile.rol === "admin" ||
    profile.id === play.director_id ||
    profile.id === play.subdirector_id;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 gap-2">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">{play.titulo}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <Badge variant={STATUS_VARIANTS[play.estado]}>{play.estado}</Badge>
              {play.director && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {play.director.nombre}
                </span>
              )}
              {play.dias_asignados && (
                <span className="flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  {play.dias_asignados}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={canManage ? "general" : "elenco"}>
        <TabsList>
          {canManage && (
            <TabsTrigger value="general">Información y utilería</TabsTrigger>
          )}
          <TabsTrigger value="elenco">Elenco</TabsTrigger>
          <TabsTrigger value="guion">Guion</TabsTrigger>
          <TabsTrigger value="asistencia">
            {canManage ? "Asistencia" : "Mi asistencia"}
          </TabsTrigger>
        </TabsList>

        {canManage && (
          <TabsContent value="general">
            <GeneralTab play={play} profile={profile} onSaved={load} />
          </TabsContent>
        )}
        <TabsContent value="elenco">
          <CastTab
            playId={play.id}
            members={members}
            canManage={canManage}
            onChanged={load}
          />
        </TabsContent>
        <TabsContent value="guion">
          <ScriptTab play={play} canManage={canManage} onSaved={load} />
        </TabsContent>
        <TabsContent value="asistencia">
          <AttendanceTab
            playId={play.id}
            members={members}
            profile={profile}
            canManage={canManage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
