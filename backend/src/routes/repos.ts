import { Elysia } from "elysia";
import { requireAuth } from "../middleware/auth";
import { getGitHubUserRepos } from "../lib/github";
import type { User } from "../db";

export const reposRoutes = new Elysia()
  .use(requireAuth)
  .get("/allRepos", async (ctx: any) => {
    const { user, set } = ctx as { user: User | null; set: { status: number } };
    
    if (!user) {
      set.status = 401;
      return { error: "User not found" };
    }

    try {
      const repos = await getGitHubUserRepos(user.accessToken);

      return {
        success: true,
        count: repos.length,
        repos: repos.map((repo) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          private: repo.private,
          htmlUrl: repo.html_url,
          description: repo.description,
          fork: repo.fork,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          pushedAt: repo.pushed_at,
          cloneUrl: repo.clone_url,
          defaultBranch: repo.default_branch,
          language: repo.language,
        })),
      };
    } catch (error) {
      console.error("Failed to fetch repos:", error);
      set.status = 500;
      return { error: "Failed to fetch repositories" };
    }
  });
