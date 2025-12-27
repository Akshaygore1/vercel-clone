import { useAuthQuery } from "@/hooks/useAuthQuery";
import { useReposQuery } from "@/hooks/useReposQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Lock,
  GitBranch,
  ArrowLeft,
  Github,
  ChevronRight,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/navbar";

export function ImportPage() {
  const { data: authData } = useAuthQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const {
    data: reposData,
    isLoading: reposLoading,
    error: reposError,
    refetch: reposRefetch,
  } = useReposQuery(authData?.authenticated ?? false, {
    filter: searchQuery || undefined,
    limit: 20,
  });

  const repos = reposData?.repos ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container px-4 py-8 mx-auto max-w-3xl">
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

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Let's build something new.
          </h1>
          <p className="text-muted-foreground">
            Import an existing Git Repository to deploy.
          </p>
        </div>

        {/* Import Card */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
                <Github className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Import Git Repository</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select a repository from your GitHub account
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            {/* Repository List */}
            <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
              {/* Loading State */}
              {reposLoading && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-4 py-3">
                      <Skeleton className="size-8 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-9 w-20 rounded-lg" />
                    </div>
                  ))}
                </>
              )}

              {/* Error State */}
              {reposError && (
                <div className="p-8 text-center">
                  <p className="text-destructive mb-4">
                    Failed to load repositories
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reposRefetch()}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* Empty State */}
              {!reposLoading && !reposError && repos.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "No repositories match your search"
                      : "No repositories found"}
                  </p>
                </div>
              )}

              {/* Repository Items */}
              {!reposLoading &&
                !reposError &&
                repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/50 transition-colors group cursor-pointer"
                    onClick={() => {
                      const [owner, repoName] = repo.fullName.split("/");
                      navigate(`/new/${owner}/${repoName}`);
                    }}
                  >
                    {/* Repo Icon */}
                    <div className="size-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <GitBranch className="size-4 text-muted-foreground" />
                    </div>

                    {/* Repo Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {repo.name}
                        </span>
                        {repo.private && (
                          <Lock className="size-3.5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(repo.updatedAt)}
                        {repo.language && ` · ${repo.language}`}
                      </p>
                    </div>

                    {/* Import Action */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Import
                      <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
