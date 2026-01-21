import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { v } from "convex/values";
import { query, action, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Configure Convex Auth with OAuth providers
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    /**
     * Custom redirect callback to support multiple domains:
     * - localhost (for local development) - automatically allowed
     * - Deployed dev environment (e.g., Netlify preview) - via ALLOWED_DEV_URLS
     * - Production environment - via ALLOWED_DEV_URLS or SITE_URL
     * 
     * Set ALLOWED_DEV_URLS environment variable to allow additional domains.
     * Format: comma-separated URLs, e.g., "http://localhost:3000,https://dev-marginalia.netlify.app,https://marginalia.netlify.app"
     */
    async redirect({ redirectTo }) {
      const SITE_URL = process.env.SITE_URL || "";
      
      // Allow relative paths - these will be resolved relative to SITE_URL
      if (redirectTo && redirectTo.startsWith("/")) {
        return `${SITE_URL}${redirectTo}`;
      }

      // Allow redirects to SITE_URL (Convex HTTP Actions URL)
      if (redirectTo && SITE_URL && redirectTo.startsWith(SITE_URL)) {
        return redirectTo;
      }

      // Allow localhost for local development (any port)
      if (redirectTo && redirectTo.startsWith("http://localhost:")) {
        return redirectTo;
      }

      // Allow additional URLs from environment variable
      // Format: "http://localhost:3000,https://dev-marginalia.netlify.app,https://marginalia.netlify.app"
      const allowedDevUrls = process.env.ALLOWED_DEV_URLS || "";
      if (allowedDevUrls && redirectTo) {
        const allowedUrls = allowedDevUrls.split(",").map(url => url.trim());
        for (const allowedUrl of allowedUrls) {
          if (redirectTo.startsWith(allowedUrl)) {
            console.log('[AUTH DEBUG] Redirecting to allowed URL:', redirectTo);
            return redirectTo;
          }
        }
      }

      // Fallback to SITE_URL
      return SITE_URL || "/";
    },
  },
});

/**
 * Get the current authenticated user's identity from auth users table
 * Returns null if not authenticated
 */
export const getCurrentUserIdentity = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      return null;
    }
    return await ctx.db.get(authUserId);
  },
});

/**
 * Internal query to get current authenticated user's identity
 * Used by actions that need to access auth user data
 */
export const getCurrentUserIdentityInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      return null;
    }
    return await ctx.db.get(authUserId);
  },
});

/**
 * Internal query to get auth user info from users table
 * Since we override the users table in schema, authUserId refers to our custom users table
 */
export const getAuthUserInfo = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<{ email?: string; name?: string } | null> => {
    // Get user from our custom users table (which overrides the auth users table)
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    // Our users table has email and name fields
    return {
      email: user.email,
      name: user.name,
    };
  },
});

/**
 * Get the current user's ID from our custom users table
 * Returns null if not authenticated or user doesn't exist in users table
 * This is an action because it needs to call a mutation to create users
 */
export const getCurrentUserId = action({
  args: {},
  handler: async (ctx): Promise<Id<"users"> | null> => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      return null;
    }

    // Get auth user directly from the database (since we override users table, 
    // the auth user is in our custom users table)
    const authUser = await ctx.runQuery(internal.auth.getCurrentUserIdentityInternal);
    if (!authUser) {
      return null;
    }

    // Extract email and name from auth user
    // The auth user might have email/name in different fields depending on provider
    const email = (authUser as any).email || (authUser as any).name || "unknown";
    const name = (authUser as any).name || (authUser as any).email || "Unknown User";

    // Get or create user from identity in our users table
    return await ctx.runMutation(internal.users.getOrCreateUserFromIdentity, {
      email,
      name,
    });
  },
});

/**
 * Require authentication - throws if not authenticated
 * Returns the user ID from our custom users table
 * This is an action because it needs to call a mutation to create users
 */
export const requireAuth = action({
  args: {},
  handler: async (ctx): Promise<Id<"users">> => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    // Get auth user directly from the database
    const authUser = await ctx.runQuery(internal.auth.getCurrentUserIdentityInternal);
    if (!authUser) {
      throw new Error("Failed to get auth user");
    }

    // Extract email and name from auth user
    const email = (authUser as any).email || (authUser as any).name || "unknown";
    const name = (authUser as any).name || (authUser as any).email || "Unknown User";

    const userId = await ctx.runMutation(internal.users.getOrCreateUserFromIdentity, {
      email,
      name,
    });

    if (!userId) {
      throw new Error("Failed to get or create user");
    }

    return userId;
  },
});

/**
 * Legacy query for backward compatibility
 * @deprecated Use getCurrentUserId action instead
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      return null;
    }
    
    // Get auth user to extract email
    const authUser = await ctx.db.get(authUserId);
    if (!authUser || !authUser.email) {
      return null;
    }
    
    // Try to find existing user by email in our users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .first();
    
    return user?._id ?? null;
  },
});


