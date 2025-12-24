import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const reposKeys = {
  all: ["repos"] as const,
  list: () => [...reposKeys.all, "list"] as const,
};

export function useReposQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: reposKeys.list(),
    queryFn: api.getRepos,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
