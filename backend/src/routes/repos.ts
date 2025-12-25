import { Elysia } from "elysia";
import { requireAuth } from "../middleware/auth";
import { getGitHubUserRepos } from "../lib/github";
import type { User } from "../db";

export const reposRoutes = new Elysia()
  .use(requireAuth)
  .get("/allRepos", async ({ user, set, query }: any) => {
    if (!user) {
      set.status = 401;
      return { error: "User not found" };
    }

    const filter = query?.filter as string | undefined;
    const limitStr = query?.limit as string | undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    try {
      const repos = await getGitHubUserRepos(
        user.accessToken,
        filter ? undefined : limit && limit > 0 ? limit : undefined
      );

      let filteredRepos = repos;
      if (filter) {
        const filterLower = filter.toLowerCase();
        filteredRepos = repos.filter(
          (repo) =>
            repo.name.toLowerCase().includes(filterLower) ||
            (repo.description &&
              repo.description.toLowerCase().includes(filterLower))
        );
        if (limit && limit > 0 && filteredRepos.length > limit) {
          filteredRepos = filteredRepos.slice(0, limit);
        }
      }

      const limitedRepos = filteredRepos;
      return {
        success: true,
        count: limitedRepos.length,
        repos: limitedRepos.map((repo) => ({
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
