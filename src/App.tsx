import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthProvider";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { PlayDetailPage } from "@/pages/PlayDetailPage";
import { ActorPlayPage } from "@/pages/ActorPlayPage";
import { JustificantesPage } from "@/pages/JustificantesPage";
import { AdminUsersPage } from "@/pages/AdminUsersPage";
import { AdminActorsPage } from "@/pages/AdminActorsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Recuperacion: el enlace del correo crea una sesion de tipo recovery,
            por eso esta fuera de PublicOnlyRoute. */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/perfil" element={<ProfilePage />} />

            {/* Direccion / gestion de obra */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["admin", "director", "subdirector"]}
                />
              }
            >
              <Route path="/obras/:id" element={<PlayDetailPage />} />
            </Route>

            {/* Vista exclusiva del actor (solo lectura) */}
            <Route
              element={<ProtectedRoute allowedRoles={["actor"]} />}
            >
              <Route path="/mis-obras/:id" element={<ActorPlayPage />} />
            </Route>

            {/* Admin / Director */}
            <Route
              element={<ProtectedRoute allowedRoles={["admin", "director"]} />}
            >
              <Route path="/justificantes" element={<JustificantesPage />} />
              <Route path="/admin/actores" element={<AdminActorsPage />} />
            </Route>

            {/* Admin only */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin/usuarios" element={<AdminUsersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
