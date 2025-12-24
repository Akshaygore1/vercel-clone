import { Elysia } from "elysia";
import { db, users, type User } from "../db";
import { eq } from "drizzle-orm";
import { exchangeCodeForToken, getGitHubUser } from "../lib/github";
import { jwtPlugin, type JWTPayload } from "../middleware/auth";
import { cookie } from "@elysiajs/cookie";

const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(cookie())
  .use(jwtPlugin)
  .get("/github", ({ set }) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    const redirectUri = `${backendUrl}/auth/github/callback`;
    const scope = "read:user user:email repo";
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "GitHub OAuth credentials not configured" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const authUrl = new URL(GITHUB_OAUTH_URL);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scope);

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
      },
    });
  })
  .get("/github/callback", async ({ query, jwt, cookie, set }) => {
    const { code } = query;

    if (!code) {
      set.status = 400;
      return { error: "Missing authorization code" };
    }

    try {
      // Exchange code for access token
      const accessToken = await exchangeCodeForToken(code);

      // Get GitHub user info
      const githubUser = await getGitHubUser(accessToken);

      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.githubId, githubUser.id.toString()))
        .limit(1);

      let userId: number;

      if (existingUser) {
        // Update existing user's access token
        await db
          .update(users)
          .set({
            accessToken,
            username: githubUser.login,
            email: githubUser.email,
            avatarUrl: githubUser.avatar_url,
          })
          .where(eq(users.id, existingUser.id));
        userId = existingUser.id;
      } else {
        // Create new user
        const [newUser] = await db
          .insert(users)
          .values({
            githubId: githubUser.id.toString(),
            username: githubUser.login,
            email: githubUser.email,
            accessToken,
            avatarUrl: githubUser.avatar_url,
          })
          .returning({ id: users.id });
        userId = newUser.id;
      }

      // Create JWT token
      const token = await jwt.sign({
        userId,
        githubId: githubUser.id.toString(),
      });

      // Set HTTP-only cookie
      const isProduction = process.env.NODE_ENV === "production";
      cookie.auth.set({
        value: token,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        ...(isProduction ? {} : { domain: "localhost" }),
      });

      // Redirect to frontend
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      return new Response(null, {
        status: 302,
        headers: {
          Location: frontendUrl,
        },
      });
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      set.status = 500;
      return { error: "Authentication failed" };
    }
  })
  .get("/me", async ({ cookie, jwt }) => {
    const token = cookie.auth?.value;

    if (!token) {
      return { authenticated: false, user: null };
    }

    try {
      const payload = await jwt.verify(token as string);

      if (!payload || typeof payload !== "object" || !("userId" in payload)) {
        return { authenticated: false, user: null };
      }

      const userId = (payload as unknown as JWTPayload).userId;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return { authenticated: false, user: null };
      }

      return {
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      return { authenticated: false, user: null };
    }
  })
  .post("/logout", ({ cookie }) => {
    cookie.auth.remove();
    return { success: true, message: "Logged out successfully" };
  });
