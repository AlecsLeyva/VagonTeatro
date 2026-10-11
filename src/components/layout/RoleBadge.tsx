import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/utils";
import type { UserRole } from "@/types";

const variants: Record<
  UserRole,
  "gold" | "default" | "secondary" | "success"
> = {
  admin: "gold",
  director: "default",
  subdirector: "secondary",
  actor: "success",
};

export function RoleBadge({ rol }: { rol: UserRole }) {
  return <Badge variant={variants[rol]}>{ROLE_LABELS[rol]}</Badge>;
}
