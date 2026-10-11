import { useAuth } from "@/context/AuthContext";
import { FullPageSpinner } from "@/components/ui/spinner";
import { AdminDashboard } from "./dashboard/AdminDashboard";
import { DirectorDashboard } from "./dashboard/DirectorDashboard";
import { ActorDashboard } from "./dashboard/ActorDashboard";

export function DashboardPage() {
  const { profile, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!profile) return <FullPageSpinner label="Cargando perfil..." />;

  switch (profile.rol) {
    case "admin":
      return <AdminDashboard profile={profile} />;
    case "director":
    case "subdirector":
      return <DirectorDashboard profile={profile} />;
    case "actor":
    default:
      return <ActorDashboard profile={profile} />;
  }
}
