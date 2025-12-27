import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { useDeployMutation } from "@/hooks/useDeployMutation";
import type { DeployResponse } from "@/lib/api";
import {
  ArrowLeft,
  Rocket,
  Loader2,
  GitBranch,
  Folder,
  Settings2,
  ChevronDown,
} from "lucide-react";

export function ConfigurePage() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState(repo || "");
  const [rootDirectory, setRootDirectory] = useState("./");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const deployMutation = useDeployMutation();

  const handleDeploy = () => {
    if (!owner || !repo) return;

    deployMutation.mutate(
      {
        repoFullName: `${owner}/${repo}`,
        projectName: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      },
      {
        onSuccess: (data: DeployResponse) => {
          navigate(`/deploying/${data.deploymentId}`);
        },
      }
    );
  };

  const sanitizedName =
    projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "project";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 py-8 mx-auto max-w-2xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/new")}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Configure Project
          </h1>
          <p className="text-muted-foreground">
            Configure your project settings before deploying.
          </p>
        </div>

        {/* Repository Info Card */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-secondary flex items-center justify-center">
                <GitBranch className="size-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base font-medium">
                  {owner}/{repo}
                </CardTitle>
                <p className="text-sm text-muted-foreground">main branch</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Configuration Card */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="size-5" />
              Project Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <label
                htmlFor="projectName"
                className="text-sm font-medium leading-none"
              >
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                placeholder="my-awesome-project"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground">
                Your site will be available at{" "}
                <span className="font-mono text-foreground">
                  {sanitizedName}.deploy.dev
                </span>
              </p>
            </div>

            <Separator />

            {/* Root Directory */}
            <div className="space-y-2">
              <label
                htmlFor="rootDir"
                className="text-sm font-medium leading-none flex items-center gap-2"
              >
                <Folder className="size-4" />
                Root Directory
              </label>
              <input
                id="rootDir"
                type="text"
                placeholder="./"
                value={rootDirectory}
                onChange={(e) => setRootDirectory(e.target.value)}
                className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <p className="text-xs text-muted-foreground">
                The directory where your source files are located.
              </p>
            </div>

            {/* Advanced Settings Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={`size-4 transition-transform ${
                  showAdvanced ? "rotate-180" : ""
                }`}
              />
              Advanced Settings
            </button>

            {showAdvanced && (
              <div className="space-y-4 pl-6 border-l-2 border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Build Command
                  </label>
                  <input
                    type="text"
                    placeholder="npm run build"
                    className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Output Directory
                  </label>
                  <input
                    type="text"
                    placeholder="dist"
                    className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Install Command
                  </label>
                  <input
                    type="text"
                    placeholder="npm install"
                    className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deploy Button */}
        <Button
          onClick={handleDeploy}
          disabled={!projectName.trim() || deployMutation.isPending}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {deployMutation.isPending ? (
            <>
              <Loader2 className="size-5 mr-2 animate-spin" />
              Starting deployment...
            </>
          ) : (
            <>
              <Rocket className="size-5 mr-2" />
              Deploy
            </>
          )}
        </Button>

        {deployMutation.isError && (
          <p className="mt-4 text-sm text-destructive text-center">
            Failed to start deployment. Please try again.
          </p>
        )}
      </main>
    </div>
  );
}
