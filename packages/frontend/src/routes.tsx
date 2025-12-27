import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ImportPage } from "@/pages/ImportPage";
import { ConfigurePage } from "@/pages/ConfigurePage";
import { DeployPage } from "@/pages/DeployPage";
import { ProjectPage } from "@/pages/ProjectPage";

export interface RouteConfig {
  path: string;
  element: React.ReactNode;
  protected?: boolean;
}

export const routes: RouteConfig[] = [
  {
    path: "/login",
    element: <LoginPage />,
    protected: false,
  },
  {
    path: "/",
    element: <DashboardPage />,
    protected: true,
  },
  {
    path: "/new",
    element: <ImportPage />,
    protected: true,
  },
  {
    path: "/new/:owner/:repo",
    element: <ConfigurePage />,
    protected: true,
  },
  {
    path: "/deploying/:deploymentId",
    element: <DeployPage />,
    protected: true,
  },
  {
    path: "/project/:projectName",
    element: <ProjectPage />,
    protected: true,
  },
];

export const publicRoutes = routes.filter((route) => !route.protected);
export const protectedRoutes = routes.filter((route) => route.protected);
