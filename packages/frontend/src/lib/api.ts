const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface User {
  id: number;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Repo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  fork: boolean;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  cloneUrl: string;
  defaultBranch: string;
  language: string | null;
}

export interface AuthResponse {
  authenticated: boolean;
  user: User | null;
}

export interface ReposResponse {
  success: boolean;
  count: number;
  repos: Repo[];
}

export interface DeployRequest {
  repoFullName: string;
  projectName: string;
}

export interface DeployResponse {
  success: boolean;
  deploymentId: number;
  message: string;
}

export interface DeploymentStatus {
  id: number;
  projectName: string;
  repoFullName: string;
  status: "pending" | "building" | "deployed" | "failed";
  deployUrl: string | null;
  buildLogs: string | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  checkAuth: () => fetchAPI<AuthResponse>("/auth/me"),
  logout: () =>
    fetchAPI<{ success: boolean }>("/auth/logout", { method: "POST" }),
  getRepos: (params?: { filter?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.filter) {
      searchParams.set("filter", params.filter);
    }
    if (params?.limit !== undefined) {
      searchParams.set("limit", params.limit.toString());
    }
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/allRepos?${queryString}` : "/allRepos";
    return fetchAPI<ReposResponse>(endpoint);
  },
  getLoginUrl: () => `${API_URL}/auth/github`,
  deployRepo: (data: DeployRequest) =>
    fetchAPI<DeployResponse>("/deploy", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getDeploymentStatus: (deploymentId: number) =>
    fetchAPI<DeploymentStatus>(`/deploy/${deploymentId}`),
};
