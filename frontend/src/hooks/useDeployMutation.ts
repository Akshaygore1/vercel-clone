import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DeployRequest, DeployResponse } from "@/lib/api";

export function useDeployMutation() {
  return useMutation<DeployResponse, Error, DeployRequest>({
    mutationFn: (data) => api.deployRepo(data),
  });
}
