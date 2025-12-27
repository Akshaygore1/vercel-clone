import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ImportPage } from "@/pages/ImportPage";
import { ConfigurePage } from "@/pages/ConfigurePage";
import { DeployPage } from "@/pages/DeployPage";
import { ProjectPage } from "@/pages/ProjectPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new"
            element={
              <ProtectedRoute>
                <ImportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new/:owner/:repo"
            element={
              <ProtectedRoute>
                <ConfigurePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deploying/:deploymentId"
            element={
              <ProtectedRoute>
                <DeployPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project/:projectName"
            element={
              <ProtectedRoute>
                <ProjectPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
