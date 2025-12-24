import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { cookie } from "@elysiajs/cookie";
import "dotenv/config";

import { authRoutes } from "./routes/auth";
import { reposRoutes } from "./routes/repos";
import { webhookRoutes } from "./routes/webhook";

const app = new Elysia()
  .use(cookie())
  .use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    })
  )
  .get("/", () => ({
    name: "Vercel Clone API",
    version: "1.0.0",
    status: "running",
  }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(reposRoutes)
  .use(webhookRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
