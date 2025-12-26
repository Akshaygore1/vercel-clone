import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { useDeployMutation } from "@/hooks/useDeployMutation";
import { useDeploymentStatus } from "@/hooks/useDeploymentStatus";
import type { DeployResponse } from "@/lib/api";
import {
  ArrowLeft,
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

export function DeployPage() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState(repo || "");
  const [deploymentId, setDeploymentId] = useState<number | null>(null);

  const deployMutation = useDeployMutation();
  const { data: deploymentStatus, isLoading: statusLoading } =
    useDeploymentStatus(deploymentId);

  const handleDeploy = () => {
    console.log("Deploying project:", owner, repo, projectName);
    if (!owner || !repo) return;

    deployMutation.mutate(
      {
        repoFullName: `${owner}/${repo}`,
        projectName: projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      },
      {
        onSuccess: (data: DeployResponse) => {
          setDeploymentId(data.deploymentId);
        },
      }
    );
  };

  const isDeploying =
    deployMutation.isPending ||
    (deploymentStatus &&
      ["pending", "building"].includes(deploymentStatus.status));
  const isDeployed = deploymentStatus?.status === "deployed";
  const isFailed = deploymentStatus?.status === "failed";

  const getStatusIcon = () => {
    if (!deploymentStatus) return null;
    switch (deploymentStatus.status) {
      case "pending":
      case "building":
        return <Loader2 className="size-5 animate-spin text-blue-500" />;
      case "deployed":
        return <CheckCircle2 className="size-5 text-green-500" />;
      case "failed":
        return <XCircle className="size-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!deploymentStatus) return "";
    switch (deploymentStatus.status) {
      case "pending":
        return "Preparing deployment...";
      case "building":
        return "Building your project...";
      case "deployed":
        return "Deployment successful!";
      case "failed":
        return "Deployment failed";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 py-8 mx-auto max-w-2xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to repositories
        </Button>

        {/* Project Config Card */}
        <div className="rounded-xl border bg-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Deploy Project</h2>
          <p className="text-muted-foreground mb-6">
            Deploying{" "}
            <span className="font-medium text-foreground">
              {owner}/{repo}
            </span>
          </p>

          {/* Project Name Input */}
          <div className="space-y-2 mb-6">
            <label
              htmlFor="projectName"
              className="text-sm font-medium leading-none"
            >
              Project Name
            </label>
            <Input
              id="projectName"
              type="text"
              placeholder="my-awesome-project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={!!deploymentId}
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              Your site will be available at{" "}
              <span className="font-mono">
                {projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-") ||
                  "project"}
                -xxxx.deploy.dev
              </span>
            </p>
          </div>

          {/* Deploy Button */}
          <Button
            onClick={handleDeploy}
            disabled={!projectName.trim() || isDeploying || isDeployed}
            className="w-full sm:w-auto"
          >
            {deployMutation.isPending ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Starting deployment...
              </>
            ) : isDeployed ? (
              <>
                <CheckCircle2 className="size-4 mr-2" />
                Deployed
              </>
            ) : (
              <>
                <Rocket className="size-4 mr-2" />
                Deploy
              </>
            )}
          </Button>

          {deployMutation.isError && (
            <p className="mt-4 text-sm text-destructive">
              Failed to start deployment. Please try again.
            </p>
          )}
        </div>

        {/* Status & Logs Card - Only show after deployment starts */}
        {deploymentId && (
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Deployment Status</h3>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span
                  className={`text-sm font-medium ${
                    isDeployed
                      ? "text-green-500"
                      : isFailed
                      ? "text-red-500"
                      : "text-blue-500"
                  }`}
                >
                  {getStatusText()}
                </span>
              </div>
            </div>

            {/* Deploy URL */}
            {isDeployed && deploymentStatus?.deployUrl && (
              <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-muted-foreground mb-2">
                  Your site is live at:
                </p>
                <a
                  href={deploymentStatus.deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-500 hover:underline font-medium"
                >
                  {deploymentStatus.deployUrl}
                  <ExternalLink className="size-4" />
                </a>
              </div>
            )}

            {/* Build Logs */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Build Logs</h4>
              <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs max-h-80 overflow-y-auto">
                {statusLoading && !deploymentStatus ? (
                  <p className="text-muted-foreground">Loading logs...</p>
                ) : deploymentStatus?.buildLogs ? (
                  <pre className="whitespace-pre-wrap break-all">
                    {deploymentStatus.buildLogs}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">
                    Waiting for build logs...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
