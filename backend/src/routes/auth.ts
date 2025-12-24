import { Elysia } from "elysia";
import { db, users, type User } from "../db";
import { eq } from "drizzle-orm";
import { exchangeCodeForToken, getGitHubUser } from "../lib/github";
import { authPlugin, jwtPlugin } from "../middleware/auth";

const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(jwtPlugin)
  .get("/github", ({ set }) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL}/auth/github/callback`;
    const scope = "read:user user:email repo";

    const authUrl = new URL(GITHUB_OAUTH_URL);
    authUrl.searchParams.set("client_id", clientId!);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scope);

    set.redirect = authUrl.toString();
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
      cookie.auth.set({
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      // Redirect to frontend
      set.redirect = process.env.FRONTEND_URL || "http://localhost:5173";
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      set.status = 500;
      return { error: "Authentication failed" };
    }
  })
  .use(authPlugin)
  .get("/me", (ctx: any) => {
    const { user, isAuthenticated } = ctx as { user: User | null; isAuthenticated: boolean };
    if (!isAuthenticated || !user) {
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
  })
  .post("/logout", ({ cookie }) => {
    cookie.auth.remove();
    return { success: true, message: "Logged out successfully" };
  });
