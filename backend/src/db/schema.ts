import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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
