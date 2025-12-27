import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DeploymentStatus } from "@/lib/api";

export const deploymentKeys = {
  all: ["deployments"] as const,
  detail: (id: number) => [...deploymentKeys.all, "detail", id] as const,
};

export function useDeploymentStatus(deploymentId: number | null) {
  return useQuery<DeploymentStatus>({
    queryKey: deploymentKeys.detail(deploymentId!),
    queryFn: () => api.getDeploymentStatus(deploymentId!),
    enabled: deploymentId !== null,
    // Poll every 2 seconds while pending or building
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "building") {
        return 2000;
      }
      return false;
    },
  });
}
