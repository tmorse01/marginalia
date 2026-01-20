import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
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
 * Internal query to get auth user info from auth users table
 * Note: authTables includes a "users" table, and we have our own "users" table
 * The authUserId from getAuthUserId refers to the auth users table
 */
// @ts-expect-error - Circular reference in type inference, but works at runtime
export const getAuthUserInfo = internalQuery({
  args: { userId: internal.id("users") },
  handler: async (ctx, args): Promise<{ email?: string; name?: string } | null> => {
    // This gets from the auth users table (from authTables)
    // Since we override users in schema, this might need adjustment
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    // Auth users table has optional email and name fields
    return {
      email: (user as { email?: string }).email,
      name: (user as { name?: string }).name,
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

    // Get auth user to extract email/name using the exported query
    // Use type assertion to break circular reference
    const authUser = await ctx.runQuery(internal.auth.getAuthUserInfo as any, { userId: authUserId });
    if (!authUser) {
      return null;
    }

    // Get or create user from identity in our users table
    return await ctx.runMutation(internal.users.getOrCreateUserFromIdentity, {
      email: authUser.email ?? authUser.name ?? "unknown",
      name: authUser.name ?? authUser.email ?? "Unknown User",
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

    // Get auth user to extract email/name using the exported query
    // Use type assertion to break circular reference
    const authUser = await ctx.runQuery(internal.auth.getAuthUserInfo as any, { userId: authUserId });
    if (!authUser) {
      throw new Error("Failed to get auth user");
    }

    const userId = await ctx.runMutation(internal.users.getOrCreateUserFromIdentity, {
      email: authUser.email ?? authUser.name ?? "unknown",
      name: authUser.name ?? authUser.email ?? "Unknown User",
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


