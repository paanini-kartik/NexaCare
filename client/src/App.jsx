import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import BenefitsPage from "./pages/BenefitsPage";
import CompassPage from "./pages/CompassPage";
import DashboardPage from "./pages/DashboardPage";
import EmergencyPage from "./pages/EmergencyPage";
import EmployerPage from "./pages/EmployerPage";
import HealthProfilePage from "./pages/HealthProfilePage";

function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="health-profile" element={<HealthProfilePage />} />
        <Route path="health-compass" element={<CompassPage />} />
        <Route path="benefits" element={<BenefitsPage />} />
        <Route path="employer" element={<EmployerPage />} />
        <Route path="emergency" element={<EmergencyPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
