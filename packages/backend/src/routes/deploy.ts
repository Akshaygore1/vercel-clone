import { Elysia, t } from "elysia";
import { requireAuth } from "../middleware/auth";
import { db, deployments, type User } from "../db";
import { eq, and } from "drizzle-orm";
import { JobsClient, ExecutionsClient } from "@google-cloud/run";
import { Logging } from "@google-cloud/logging";
import { getGitHubRepo } from "../lib/github";

// Generate short unique ID for subdomain
function generateShortId(): string {
  return Math.random().toString(36).substring(2, 8);
}

// Generate random alphanumeric string for R2 base path (no dashes)
function generateR2BasePath(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Google Cloud Run configuration
const CLOUD_RUN_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const CLOUD_RUN_LOCATION = process.env.GOOGLE_CLOUD_LOCATION;
const CLOUD_RUN_JOB_NAME = process.env.CLOUD_RUN_JOB_NAME;
const DEPLOY_DOMAIN = process.env.DEPLOY_DOMAIN;

export const deployRoutes = new Elysia({ prefix: "/deploy" })
  .use(requireAuth)
  .post(
    "/",
    async ({ user, body, set }: { user: User | null; body: any; set: any }) => {
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const repo = await getGitHubRepo(body.repoFullName);
      if (!repo) {
        set.status = 404;
        return { error: "Repository not found" };
      }

      const { repoFullName, projectName, nodeVersion, buildCmd, branch } = body;
      try {
        // Generate unique subdomain and R2 base path
        const shortId = generateShortId();
        const subdomain = `${projectName}-${shortId}`;
        const deployUrl = `https://${subdomain}.${DEPLOY_DOMAIN}`;
        const r2BasePath = generateR2BasePath();

        // Create deployment record
        const [deployment] = await db
          .insert(deployments)
          .values({
            userId: user.id,
            projectName,
            repoFullName,
            repoCloneUrl: repo.clone_url,
            defaultBranch: repo.default_branch,
            status: "pending",
            deployUrl,
          })
          .returning();

        // Trigger Cloud Run job
        try {
          await triggerCloudRunJob({
            deploymentId: deployment.id,
            repoCloneUrl: repo.clone_url,
            branch: branch || repo.default_branch,
            nodeVersion: nodeVersion || "lts/latest",
            buildCmd: buildCmd || "npm run build",
            r2BasePath,
            accessToken: user.accessToken,
          });

          // Update status to building
          await db
            .update(deployments)
            .set({ status: "building", updatedAt: new Date() })
            .where(eq(deployments.id, deployment.id));
        } catch (jobError) {
          console.error("Failed to trigger Cloud Run job:", jobError);
          await db
            .update(deployments)
            .set({
              status: "failed",
              buildLogs: `Failed to start build: ${jobError}`,
              updatedAt: new Date(),
            })
            .where(eq(deployments.id, deployment.id));
        }

        return {
          success: true,
          deploymentId: deployment.id,
          message: "Deployment started",
        };
      } catch (error) {
        console.error("Deployment error:", error);
        set.status = 500;
        return { error: "Failed to create deployment" };
      }
    },
    {
      body: t.Object({
        repoFullName: t.String(),
        projectName: t.String(),
        nodeVersion: t.Optional(t.String()),
        buildCmd: t.Optional(t.String()),
        branch: t.Optional(t.String()),
      }),
    }
  )
  .get("/:id", async ({ user, params, set }: any) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    const deploymentId = parseInt(params.id, 10);

    if (isNaN(deploymentId)) {
      set.status = 400;
      return { error: "Invalid deployment ID" };
    }

    const [deployment] = await db
      .select()
      .from(deployments)
      .where(
        and(eq(deployments.id, deploymentId), eq(deployments.userId, user.id))
      )
      .limit(1);

    if (!deployment) {
      set.status = 404;
      return { error: "Deployment not found" };
    }

    return {
      id: deployment.id,
      projectName: deployment.projectName,
      repoFullName: deployment.repoFullName,
      status: deployment.status,
      deployUrl: deployment.deployUrl,
      buildLogs: deployment.buildLogs,
      createdAt: deployment.createdAt.toISOString(),
      updatedAt: deployment.updatedAt.toISOString(),
    };
  });

interface CloudRunJobParams {
  deploymentId: number;
  repoCloneUrl: string;
  branch: string;
  nodeVersion: string;
  buildCmd: string;
  r2BasePath: string;
  accessToken: string;
}

async function triggerCloudRunJob(params: CloudRunJobParams): Promise<void> {
  const {
    deploymentId,
    repoCloneUrl,
    branch,
    nodeVersion,
    buildCmd,
    r2BasePath,
  } = params;

  const client = new JobsClient();

  const jobName = `projects/${CLOUD_RUN_PROJECT_ID}/locations/${CLOUD_RUN_LOCATION}/jobs/${CLOUD_RUN_JOB_NAME}`;

  // Run the job with environment variable overrides
  const [operation] = await client.runJob({
    name: jobName,
    overrides: {
      containerOverrides: [
        {
          env: [
            { name: "REPO_URL", value: repoCloneUrl },
            { name: "BRANCH", value: branch },
            { name: "NODE_VERSION", value: nodeVersion },
            { name: "BUILD_CMD", value: buildCmd },
            { name: "R2_BASE_PATH", value: r2BasePath },
            { name: "DEPLOYMENT_ID", value: deploymentId.toString() },
          ],
        },
      ],
    },
  });

  console.log(
    `Cloud Run job triggered for deployment ${operation}`,
    JSON.stringify(operation, null, 2)
  );

  // Store the job execution name for status tracking
  if (operation.name) {
    await db
      .update(deployments)
      .set({
        cloudRunJobName: operation.name,
        buildLogs: "Build job started...\n",
        updatedAt: new Date(),
      })
      .where(eq(deployments.id, deploymentId));
  }
}
