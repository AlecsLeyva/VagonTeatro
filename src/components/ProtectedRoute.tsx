import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FullPageSpinner } from "@/components/ui/spinner";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageSpinner label="Validando sesión..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are restricted but the profile has not loaded yet, wait.
  if (allowedRoles && !profile) {
    return <FullPageSpinner label="Cargando perfil..." />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
