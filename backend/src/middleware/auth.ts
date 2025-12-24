import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db, users, type User } from "../db";
import { eq } from "drizzle-orm";

export interface JWTPayload {
  userId: number;
  githubId: string;
}

export interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
}

export const jwtPlugin = new Elysia({ name: "jwtPlugin" }).use(
  jwt({
    name: "jwt",
    secret: process.env.JWT_SECRET || "fallback-secret-change-me",
  })
);

export const authPlugin = new Elysia({ name: "auth" })
  .use(jwtPlugin)
  // @ts-ignore - Elysia derive type inference issue
  .derive(async ({ jwt: jwtInstance, cookie }): Promise<AuthContext> => {
    const token = cookie.auth?.value;

    if (!token) {
      return { user: null, isAuthenticated: false };
    }

    try {
      const payload = await jwtInstance.verify(token as string);

      if (!payload || typeof payload !== "object" || !("userId" in payload)) {
        return { user: null, isAuthenticated: false };
      }

      const userId = (payload as unknown as JWTPayload).userId;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return { user: null, isAuthenticated: false };
      }

      return { user, isAuthenticated: true };
    } catch {
      return { user: null, isAuthenticated: false };
    }
  });

export const requireAuth = new Elysia({ name: "requireAuth" })
  .use(authPlugin)
  .onBeforeHandle((ctx: any) => {
    const { user, isAuthenticated, set } = ctx;
    if (!isAuthenticated || !user) {
      set.status = 401;
      return { error: "Unauthorized", message: "Authentication required" };
    }
  });
