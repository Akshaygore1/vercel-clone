import { useAuthQuery } from "@/hooks/useAuthQuery";
import { useReposQuery } from "@/hooks/useReposQuery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Lock } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { useState } from "react";
import { Navbar } from "@/components/navbar";

export function DashboardPage() {
  const { data: authData } = useAuthQuery();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: reposData,
    isLoading: reposLoading,
    error: reposError,
    refetch: reposRefetch,
  } = useReposQuery(authData?.authenticated ?? false, {
    filter: searchQuery || undefined,
    limit: 5,
  });

  const repos = reposData?.repos ?? [];

  // Get initials or first letter for avatar fallback
  const getRepoInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Get a color based on repo name for variety
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-teal-500",
      "bg-indigo-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <main className="container px-4 py-8 mx-auto max-w-3xl">
        {/* Import Git Repository Section */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold mb-6">Import Git Repository</h2>

          {/* Filter Bar */}
          <div className="flex gap-3 mb-6">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Repository List */}
          <div className="space-y-1">
            {/* Loading State */}
            {reposLoading && (
              <div className="space-y-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg"
                  >
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-9 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
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

            {/* Empty State */}
            {!reposLoading && !reposError && repos.length === 0 && (
              <div className="rounded-lg border bg-muted/50 p-8 text-center">
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
                  className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  {/* Avatar */}
                  <Avatar className="size-10">
                    <AvatarFallback
                      className={`${getAvatarColor(
                        repo.name
                      )} text-white font-semibold`}
                    >
                      {getRepoInitial(repo.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Repo Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{repo.name}</span>
                      {repo.private && (
                        <Lock className="size-3.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <span className="text-sm text-muted-foreground shrink-0">
                    {formatRelativeTime(repo.updatedAt)}
                  </span>

                  {/* Import Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                  >
                    Import
                  </Button>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
