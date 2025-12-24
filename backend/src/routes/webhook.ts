import { Elysia } from "elysia";
import { verifyWebhookSignature } from "../lib/github";

interface PushEventPayload {
  ref: string;
  before: string;
  after: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    clone_url: string;
    default_branch: string;
  };
  pusher: {
    name: string;
    email: string;
  };
  sender: {
    id: number;
    login: string;
  };
  commits: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
  }>;
}

export const webhookRoutes = new Elysia({ prefix: "/webhook" }).post(
  "/github",
  async ({ request, set }) => {
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");
    const deliveryId = request.headers.get("x-github-delivery");

    if (!signature) {
      set.status = 401;
      return { error: "Missing signature" };
    }

    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      console.error("GITHUB_WEBHOOK_SECRET is not configured");
      set.status = 500;
      return { error: "Webhook secret not configured" };
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(rawBody, signature, secret);

    if (!isValid) {
      set.status = 401;
      return { error: "Invalid signature" };
    }

    // Parse the payload
    let payload: PushEventPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      set.status = 400;
      return { error: "Invalid JSON payload" };
    }

    console.log(`Received GitHub webhook: ${event} (${deliveryId})`);

    // Handle different event types
    switch (event) {
      case "push":
        return handlePushEvent(payload);

      case "ping":
        return { success: true, message: "Pong! Webhook is configured correctly." };

      default:
        return { success: true, message: `Event '${event}' received but not handled` };
    }
  }
);

async function handlePushEvent(payload: PushEventPayload) {
  const { repository, ref, commits, pusher } = payload;

  // Extract branch name from ref (refs/heads/main -> main)
  const branch = ref.replace("refs/heads/", "");

  console.log(`Push event received for ${repository.full_name}`);
  console.log(`Branch: ${branch}`);
  console.log(`Commits: ${commits.length}`);
  console.log(`Pusher: ${pusher.name}`);

  // Check if this is the default branch (for auto-deploy)
  if (branch === repository.default_branch) {
    console.log(`Push to default branch detected - triggering deployment...`);

    // TODO: Implement actual deployment logic here
    // This is where you would:
    // 1. Look up the project in your database by repository.id
    // 2. Clone/pull the latest code
    // 3. Build the project
    // 4. Deploy to your infrastructure

    return {
      success: true,
      message: "Deployment triggered",
      data: {
        repository: repository.full_name,
        branch,
        commitCount: commits.length,
        latestCommit: commits[0]?.message || "No commits",
      },
    };
  }

  return {
    success: true,
    message: "Push received but not to default branch - skipping deployment",
    data: {
      repository: repository.full_name,
      branch,
      defaultBranch: repository.default_branch,
    },
  };
}

