// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  githubId: string;
  githubAccessToken: string;
  createdAt: Date;
  updatedAt: Date;
}

// Deployment types
export type DeploymentStatus =
  | "queued"
  | "building"
  | "deploying"
  | "ready"
  | "failed"
  | "cancelled";

export interface Deployment {
  id: string;
  userId: string;
  repoFullName: string;
  branch: string;
  commitSha: string;
  status: DeploymentStatus;
  subdomain: string;
  buildLogs: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Repository types
export interface Repository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  defaultBranch: string;
  updatedAt: string;
  htmlUrl: string;
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
  };
}
