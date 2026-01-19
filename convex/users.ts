import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      createdAt: Date.now(),
      subscriptionTier: "free", // Default to free tier for new users
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

