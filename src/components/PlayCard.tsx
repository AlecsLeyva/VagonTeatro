import { useNavigate } from "react-router-dom";
import { CalendarClock, Download, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlayWithRelations } from "@/types";
import { THEATRICAL_ROLE_LABELS } from "@/lib/utils";

const STATUS_VARIANTS = {
  activa: "success",
  pausada: "warning",
  finalizada: "secondary",
} as const;

const STATUS_STRIP = {
  activa: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400",
  pausada: "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300",
  finalizada: "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300",
} as const;

interface PlayCardProps {
  play: PlayWithRelations;
  memberCount?: number;
  theatricalRole?: keyof typeof THEATRICAL_ROLE_LABELS | null;
  canManage?: boolean;
  detailPath?: string;
  onDownload?: (play: PlayWithRelations) => void;
}

export function PlayCard({
  play,
  memberCount,
  theatricalRole,
  canManage,
  detailPath,
  onDownload,
}: PlayCardProps) {
  const navigate = useNavigate();
  const target = detailPath ?? `/obras/${play.id}`;

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-warm-lg">
      <div className={`h-1.5 w-full ${STATUS_STRIP[play.estado]}`} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-display text-lg">{play.titulo}</CardTitle>
          <Badge variant={STATUS_VARIANTS[play.estado]}>{play.estado}</Badge>
        </div>
        {theatricalRole && (
          <Badge variant="gold" className="w-fit">
            {THEATRICAL_ROLE_LABELS[theatricalRole]}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {play.descripcion || "Sin descripción registrada."}
        </p>

        <dl className="space-y-1.5 text-sm">
          {play.director && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Director:</span>
              {play.director.nombre}
            </div>
          )}
          {play.dias_asignados && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" />
              {play.dias_asignados}
            </div>
          )}
          {typeof memberCount === "number" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {memberCount} integrantes
            </div>
          )}
        </dl>

        <div className="mt-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => navigate(target)}
            className="flex-1"
          >
            {canManage ? "Gestionar obra" : "Ver obra"}
          </Button>
          {onDownload && play.guion_url && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDownload(play)}
              className="flex-1 gap-2"
            >
              <Download className="h-4 w-4" />
              Guion
            </Button>
          )}
          {onDownload && !play.guion_url && (
            <Button size="sm" variant="outline" disabled className="flex-1 gap-2">
              <FileText className="h-4 w-4" />
              Sin guion
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
