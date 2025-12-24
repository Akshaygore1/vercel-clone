import { useAuthQuery, useLogoutMutation } from "@/hooks/useAuthQuery";
import { useReposQuery } from "@/hooks/useReposQuery";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  ExternalLink,
  GitFork,
  Lock,
  Globe,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DashboardPage() {
  const navigate = useNavigate();
  const {
    data: authData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useAuthQuery();
  const {
    data: reposData,
    isLoading: reposLoading,
    error: reposError,
    refetch: reposRefetch,
    isRefetching: reposIsRefetching,
  } = useReposQuery(authData?.authenticated ?? false);

  const repos = reposData?.repos ?? [];

  const logoutMutation = useLogoutMutation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/login");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 text-primary-foreground"
              >
                <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
              </svg>
            </div>
            <span className="text-lg font-semibold">Deploy</span>
          </div>

          <div className="flex items-center gap-4">
            {authData?.user && (
              <div className="flex items-center gap-3">
                {authData?.user.avatarUrl && (
                  <img
                    src={authData?.user.avatarUrl}
                    alt={authData?.user.username}
                    className="size-8 rounded-full ring-2 ring-border"
                  />
                )}
                <span className="text-sm font-medium hidden sm:block">
                  {authData?.user.username}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8 mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Your Repositories
            </h1>
            <p className="text-muted-foreground mt-1">
              Select a repository to deploy
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reposRefetch()}
            disabled={reposLoading || reposIsRefetching}
          >
            <RefreshCw
              className={`size-4 ${reposIsRefetching ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {reposLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading repositories...</p>
            </div>
          </div>
        )}

        {reposError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <p className="text-destructive">Failed to load repositories</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => reposRefetch()}
            >
              Try Again
            </Button>
          </div>
        )}

        {!reposLoading && !reposError && repos.length === 0 && (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">No repositories found</p>
          </div>
        )}

        {!reposLoading && !reposError && repos.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
              <a
                key={repo.id}
                href={repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {repo.name}
                      </h3>
                      {repo.private ? (
                        <Lock className="size-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <Globe className="size-3.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>

                <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                  {repo.language && (
                    <div className="flex items-center gap-1.5">
                      <span className="size-2.5 rounded-full bg-primary" />
                      {repo.language}
                    </div>
                  )}
                  {repo.fork && (
                    <div className="flex items-center gap-1">
                      <GitFork className="size-3" />
                      Fork
                    </div>
                  )}
                  <span>{repo.defaultBranch}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
