import * as React from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "gold";

const variants: Record<Variant, string> = {
  default:
    "border-transparent bg-gradient-to-br from-stage to-stage-light text-white shadow-warm-sm shadow-stage/20",
  secondary: "border-border/70 bg-secondary text-secondary-foreground",
  outline: "border-border/80 bg-background/60 text-foreground",
  success: "border-emerald-200/80 bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/10",
  warning: "border-amber-200/80 bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/10",
  danger: "border-red-200/80 bg-red-50 text-red-800 ring-1 ring-inset ring-red-600/10",
  gold: "border-stage-gold/40 bg-gradient-to-br from-stage-gold/25 to-stage-amber/20 text-stage-dark ring-1 ring-inset ring-stage-gold/20",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
