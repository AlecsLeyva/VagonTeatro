import { Link } from "react-router-dom";
import { Theater } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  compact,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      to="/dashboard"
      className={cn("flex items-center gap-2 text-stage", className)}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-stage to-stage-light text-white shadow-warm shadow-stage/30 ring-1 ring-stage-gold/30">
        <Theater className="h-[18px] w-[18px]" />
      </span>
      {!compact && (
        <span className="font-display text-xl font-bold tracking-tight text-foreground">
          Vago<span className="text-stage">n</span>Teatro
        </span>
      )}
    </Link>
  );
}
