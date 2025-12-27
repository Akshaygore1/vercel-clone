import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const reposKeys = {
  all: ["repos"] as const,
  list: (params?: { filter?: string; limit?: number }) =>
    [...reposKeys.all, "list", params] as const,
};

export function useReposQuery(
  enabled: boolean = true,
  params?: { filter?: string; limit?: number }
) {
  return useQuery({
    queryKey: reposKeys.list(params),
    queryFn: () => api.getRepos(params),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
