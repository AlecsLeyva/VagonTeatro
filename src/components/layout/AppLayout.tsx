import * as React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BookUser,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Theater,
  UserCog,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { RoleBadge } from "./RoleBadge";
import type { UserRole } from "@/types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
    roles: ["admin", "director", "subdirector", "actor"],
  },
  {
    to: "/justificantes",
    label: "Justificantes",
    icon: ClipboardList,
    roles: ["admin", "director"],
  },
  {
    to: "/admin/usuarios",
    label: "Usuarios",
    icon: UserCog,
    roles: ["admin"],
  },
  {
    to: "/admin/actores",
    label: "Actores y horarios",
    icon: Theater,
    roles: ["admin", "director"],
  },
  {
    to: "/perfil",
    label: "Mi perfil",
    icon: BookUser,
    roles: ["admin", "director", "subdirector", "actor"],
  },
];

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const items = React.useMemo(
    () =>
      profile
        ? NAV_ITEMS.filter((item) => item.roles.includes(profile.rol))
        : [],
    [profile],
  );

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  const navContent = (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/dashboard"}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-gradient-to-br from-stage via-stage-light to-stage text-white shadow-md shadow-stage/25 hover:from-stage-light"
                : "text-muted-foreground hover:bg-accent/80 hover:text-foreground backdrop-blur-sm",
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-muted/50 via-background to-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-stage/5 via-transparent to-transparent" />
      <div className="pointer-events-none absolute left-0 top-24 h-72 w-72 rounded-full bg-stage/5 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-44 h-72 w-72 rounded-full bg-stage-gold/10 blur-3xl" />
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-stage/10 bg-background/85 shadow-warm-sm backdrop-blur-xl no-print">
        <div className="h-1 w-full bg-gradient-to-r from-stage-dark via-stage-gold to-stage-dark" />
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-accent/80"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Abrir menú"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <Logo />
          </div>

          <div className="flex items-center gap-3">
            {profile && (
              <div className="hidden items-center gap-3 sm:flex">
                <div className="text-right">
                  <p className="text-sm font-medium leading-tight">
                    {profile.nombre}
                  </p>
                  <RoleBadge rol={profile.rol} />
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-stage to-stage-light text-sm font-semibold text-white shadow-md shadow-stage/25 ring-2 ring-stage-gold/20">
                  {initials(profile.nombre)}
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block no-print">
          <div className="sticky top-24 space-y-1">{navContent}</div>
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-64 animate-fade-in bg-background p-4 shadow-xl">
              <div className="mb-6">
                <Logo />
              </div>
              {navContent}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
