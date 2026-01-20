import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    return user;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subscriptionTier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      // If test user exists but isn't premium, upgrade it
      if (args.email === "test@example.com" && existing.subscriptionTier !== "premium") {
        await ctx.db.patch(existing._id, {
          subscriptionTier: "premium",
        });
      }
      return existing._id;
    }

    // Test user gets premium tier automatically
    const isTestUser = args.email === "test@example.com";
    const tier = args.subscriptionTier ?? (isTestUser ? "premium" : "free");

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      createdAt: Date.now(),
      subscriptionTier: tier,
    });

    return userId;
  },
});

/**
 * Get or create user from auth identity
 * Internal function used by auth helpers
 */
export const getOrCreateUserFromIdentity = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      // Ensure test user is premium
      if (args.email === "test@example.com" && existing.subscriptionTier !== "premium") {
        await ctx.db.patch(existing._id, {
          subscriptionTier: "premium",
        });
      }
      return existing._id;
    }

    // Test user gets premium tier automatically
    const isTestUser = args.email === "test@example.com";
    const tier = isTestUser ? "premium" : "free";

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      createdAt: Date.now(),
      subscriptionTier: tier,
    });

    return userId;
  },
});

/**
 * Get or create test user (for development)
 * Public mutation for development use
 */
export const getOrCreateTestUser = mutation({
  args: {},
  handler: async (ctx) => {
    const testEmail = "test@example.com";
    const testName = "Test User";
    
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", testEmail))
      .first();
    
    if (existing) {
      // Ensure test user is premium
      if (existing.subscriptionTier !== "premium") {
        await ctx.db.patch(existing._id, {
          subscriptionTier: "premium",
        });
      }
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      name: testName,
      email: testEmail,
      createdAt: Date.now(),
      subscriptionTier: "premium",
    });

    return userId;
  },
});

/**
 * Get user's subscription tier
 * Public query for frontend to check tier
 */
export const getSubscriptionTier = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.subscriptionTier ?? "free";
  },
});

/**
 * Internal query for AI action to check subscription tier
 */
export const getSubscriptionTierInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.subscriptionTier ?? "free";
  },
});

/**
 * Check if a user has AI access based on subscription tier
 * Public query for frontend to check access
 */
export const hasAIAccess = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const tier = user?.subscriptionTier ?? "free";
    // AI access is available for premium and enterprise tiers
    return tier === "premium" || tier === "enterprise";
  },
});

/**
 * Internal query for AI action to check access
 */
export const hasAIAccessInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const tier = user?.subscriptionTier ?? "free";
    // AI access is available for premium and enterprise tiers
    return tier === "premium" || tier === "enterprise";
  },
});

/**
 * Set subscription tier for a user (admin function)
 * This should be protected/restricted in production
 * Valid tiers: "free", "premium", "enterprise"
 */
export const setSubscriptionTier = mutation({
  args: {
    userId: v.id("users"),
    subscriptionTier: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    await ctx.db.patch(args.userId, {
      subscriptionTier: args.subscriptionTier,
    });
  },
});

