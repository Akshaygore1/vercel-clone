import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AuthResponse } from "@/lib/api";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useAuthQuery() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      try {
        const result = await api.checkAuth();
        console.log("Auth check result:", result);
        return result;
      } catch (error) {
        // If the auth check fails, return a not authenticated response
        // instead of throwing (which would put query in error state)
        console.error("Auth check failed:", error);
        return { authenticated: false, user: null } as AuthResponse;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1, // Retry once in case of race conditions
    retryDelay: 500, // Wait 500ms before retrying
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      // Invalidate and refetch auth query
      queryClient.setQueryData<AuthResponse>(authKeys.me(), {
        authenticated: false,
        user: null,
      });
      // Clear all queries on logout
      queryClient.clear();
    },
  });
}
