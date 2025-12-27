import { useAuthQuery } from "@/hooks/useAuthQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  ExternalLink,
  Clock,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, type DeploymentStatus } from "@/lib/api";

export function DashboardPage() {
  const { data: authData } = useAuthQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Fetch all deployments/projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.getProjects(),
    enabled: authData?.authenticated ?? false,
  });

  const filteredProjects =
    projects?.filter(
      (p) =>
        p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.repoFullName.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  const getStatusColor = (status: DeploymentStatus["status"]) => {
    switch (status) {
      case "deployed":
        return "bg-emerald-500";
      case "building":
        return "bg-yellow-500 animate-pulse";
      case "pending":
        return "bg-blue-500 animate-pulse";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <main className="container px-4 py-8 mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and deploy your projects
          </p>
        </div>
        <Button onClick={() => navigate("/new")} className="gap-2">
          <Plus className="size-4" />
          Add New...
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-6" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="size-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Plus className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-sm mb-4 text-center max-w-sm">
              Get started by importing a Git repository to deploy your first
              project.
            </p>
            <Button onClick={() => navigate("/new")} className="gap-2">
              <Plus className="size-4" />
              Import Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.projectName}`}
              className="block group"
            >
              <Card className="bg-card border-border hover:border-muted-foreground/50 transition-colors h-full">
                <CardContent className="p-5">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-lg font-semibold">
                          {project.projectName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                          {project.projectName}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.repoFullName}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>

                  {/* Status & URL */}
                  <div className="space-y-3">
                    {project.deployUrl && (
                      <div className="flex items-center gap-2 text-sm">
                        <ExternalLink className="size-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground truncate hover:text-foreground">
                          {project.deployUrl.replace("https://", "")}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`size-2 rounded-full ${getStatusColor(
                            project.status
                          )}`}
                        />
                        <span className="capitalize">{project.status}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3.5" />
                        <span>{formatRelativeTime(project.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
