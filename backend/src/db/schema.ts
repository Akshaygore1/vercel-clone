import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

export const deploymentStatusEnum = pgEnum("deployment_status", [
  "pending",
  "building",
  "deployed",
  "failed",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    githubId: text("github_id").notNull(),
    username: text("username").notNull(),
    email: text("email"),
    accessToken: text("access_token").notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    githubIdIdx: uniqueIndex("github_id_idx").on(table.githubId),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const deployments = pgTable(
  "deployments",
  {
    id: serial("id").primaryKey(),
    userId: serial("user_id")
      .references(() => users.id)
      .notNull(),
    projectName: text("project_name").notNull(),
    repoFullName: text("repo_full_name").notNull(),
    repoCloneUrl: text("repo_clone_url").notNull(),
    defaultBranch: text("default_branch").notNull(),
    status: deploymentStatusEnum("status").notNull().default("pending"),
    deployUrl: text("deploy_url"),
    buildLogs: text("build_logs"),
    cloudRunJobName: text("cloud_run_job_name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("deployment_user_id_idx").on(table.userId),
    statusIdx: index("deployment_status_idx").on(table.status),
  })
);

export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;
