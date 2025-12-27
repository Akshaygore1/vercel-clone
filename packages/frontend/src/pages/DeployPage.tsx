import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navbar } from "@/components/navbar";
import { useDeploymentStatus } from "@/hooks/useDeploymentStatus";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Terminal,
  GitBranch,
  ExternalLink,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";

export function DeployPage() {
  const { deploymentId } = useParams<{ deploymentId: string }>();
  const navigate = useNavigate();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const { data: deploymentStatus, isLoading: statusLoading } =
    useDeploymentStatus(deploymentId ? parseInt(deploymentId) : null);

  const isDeploying =
    deploymentStatus &&
    ["pending", "building"].includes(deploymentStatus.status);
  const isDeployed = deploymentStatus?.status === "deployed";
  const isFailed = deploymentStatus?.status === "failed";

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current && isDeploying) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [deploymentStatus?.buildLogs, isDeploying]);

  // Redirect to project page after deployment
  useEffect(() => {
    if (isDeployed && deploymentStatus?.projectName) {
      const timer = setTimeout(() => {
        navigate(`/project/${deploymentStatus.projectName}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isDeployed, deploymentStatus?.projectName, navigate]);

  const copyUrl = () => {
    if (deploymentStatus?.deployUrl) {
      navigator.clipboard.writeText(deploymentStatus.deployUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusIcon = () => {
    if (!deploymentStatus) return null;
    switch (deploymentStatus.status) {
      case "pending":
      case "building":
        return <Loader2 className="size-5 animate-spin text-blue-400" />;
      case "deployed":
        return <CheckCircle2 className="size-5 text-emerald-400" />;
      case "failed":
        return <XCircle className="size-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (!deploymentStatus) return "";
    switch (deploymentStatus.status) {
      case "pending":
        return "Preparing...";
      case "building":
        return "Building...";
      case "deployed":
        return "Complete!";
      case "failed":
        return "Failed";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    if (!deploymentStatus) return "text-muted-foreground";
    switch (deploymentStatus.status) {
      case "pending":
      case "building":
        return "text-blue-400";
      case "deployed":
        return "text-emerald-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  if (statusLoading && !deploymentStatus) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container px-4 py-8 mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 py-8 mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {isDeployed
              ? "🎉 Deployment Successful!"
              : isFailed
              ? "Deployment Failed"
              : "Deploying..."}
          </h1>
          <p className="text-muted-foreground">
            {isDeployed
              ? "Your project is now live and ready to share with the world."
              : isFailed
              ? "Something went wrong. Check the logs below for details."
              : "Please wait while we build and deploy your project."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Info Card */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GitBranch className="size-5" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Project</span>
                <span className="text-sm font-medium">
                  {deploymentStatus?.projectName}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">
                  Repository
                </span>
                <span className="text-sm font-medium font-mono">
                  {deploymentStatus?.repoFullName}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className={`text-sm font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                </div>
              </div>

              {/* Deploy URL */}
              {isDeployed && deploymentStatus?.deployUrl && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-3">
                    Your site is live at:
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-secondary rounded-lg font-mono text-sm truncate">
                      {deploymentStatus.deployUrl}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyUrl}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="size-4 text-emerald-400" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() =>
                        window.open(deploymentStatus.deployUrl!, "_blank")
                      }
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() =>
                      navigate(`/project/${deploymentStatus.projectName}`)
                    }
                  >
                    View Project
                    <ArrowRight className="size-4 ml-2" />
                  </Button>
                </div>
              )}

              {isFailed && (
                <div className="pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/new")}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Build Logs Card */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Terminal className="size-5" />
                Build Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-100 w-full rounded-lg bg-[#0d0d0d] border border-border">
                <div className="p-4 font-mono text-xs leading-relaxed">
                  {!deploymentStatus?.buildLogs ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      <span>Waiting for build logs...</span>
                    </div>
                  ) : (
                    <>
                      <pre className="whitespace-pre-wrap break-all text-gray-300">
                        {deploymentStatus.buildLogs}
                      </pre>
                      <div ref={logsEndRef} />
                    </>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
