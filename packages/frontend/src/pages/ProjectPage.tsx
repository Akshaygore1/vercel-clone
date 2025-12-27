import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/navbar";
import { useQuery } from "@tanstack/react-query";
import { api, type DeploymentStatus } from "@/lib/api";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import {
  ExternalLink,
  GitBranch,
  Clock,
  RefreshCw,
  Copy,
  Check,
  Globe,
  Settings,
  Activity,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useState } from "react";

export function ProjectPage() {
  const { projectName } = useParams<{ projectName: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectName],
    queryFn: () => api.getProjectByName(projectName!),
    enabled: !!projectName,
  });

  const copyUrl = () => {
    if (project?.deployUrl) {
      navigator.clipboard.writeText(project.deployUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status: DeploymentStatus["status"]) => {
    switch (status) {
      case "deployed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "building":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "pending":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container px-4 py-8 mx-auto max-w-6xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container px-4 py-8 mx-auto max-w-6xl">
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold mb-2">Project not found</h2>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 py-8 mx-auto max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Project Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl bg-secondary flex items-center justify-center">
              <span className="text-2xl font-bold">
                {project.projectName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{project.projectName}</h1>
                <Badge
                  variant="outline"
                  className={getStatusColor(project.status)}
                >
                  {project.status}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {project.repoFullName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Settings className="size-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <RefreshCw className="size-4 mr-2" />
              Redeploy
            </Button>
          </div>
        </div>

        {/* Live URL Card */}
        {project.deployUrl && (
          <Card className="bg-card border-border mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Globe className="size-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Production</p>
                    <a
                      href={project.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline flex items-center gap-2"
                    >
                      {project.deployUrl.replace("https://", "")}
                      <ExternalLink className="size-3.5" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={copyUrl}>
                    {copied ? (
                      <>
                        <Check className="size-4 mr-2 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="size-4 mr-2" />
                        Copy URL
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(project.deployUrl!, "_blank")}
                  >
                    <ExternalLink className="size-4 mr-2" />
                    Visit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preview & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {project.deployUrl ? (
                  <div className="relative aspect-video bg-secondary">
                    <iframe
                      src={project.deployUrl}
                      className="w-full h-full border-0"
                      title="Site Preview"
                      sandbox="allow-scripts allow-same-origin"
                    />
                    <div className="absolute inset-0 pointer-events-none border-t border-border" />
                  </div>
                ) : (
                  <div className="aspect-video bg-secondary flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Preview not available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="size-5" />
                  Deployment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={getStatusColor(project.status)}
                  >
                    {project.status}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <GitBranch className="size-4" />
                    Branch
                  </span>
                  <span className="text-sm font-mono">main</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="size-4" />
                    Last Updated
                  </span>
                  <span className="text-sm">
                    {formatRelativeTime(project.updatedAt)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {formatRelativeTime(project.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitBranch className="size-5" />
                  Repository
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={`https://github.com/${project.repoFullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <div className="size-8 rounded bg-background flex items-center justify-center">
                    <GitBranch className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {project.repoFullName}
                    </p>
                    <p className="text-xs text-muted-foreground">GitHub</p>
                  </div>
                  <ExternalLink className="size-4 text-muted-foreground" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
