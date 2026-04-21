import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const GUEST_EMAIL_SUFFIX = "@guest.marginalia";
const TEST_EMAIL = "test@example.com";

export function isAllowedGuestOrTestEmail(email: string): boolean {
  return email.endsWith(GUEST_EMAIL_SUFFIX) || email === TEST_EMAIL;
}

export const get = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/** Signed-in user profile; null if not authenticated. */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
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
    if (!isAllowedGuestOrTestEmail(args.email)) {
      throw new Error("Cannot create users with this email from the client");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      if (args.email === TEST_EMAIL && existing.subscriptionTier !== "premium") {
        await ctx.db.patch(existing._id, {
          subscriptionTier: "premium",
        });
      }
      return existing._id;
    }

    const isTestUser = args.email === TEST_EMAIL;
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
    if (!isAllowedGuestOrTestEmail(args.email)) {
      throw new Error("Invalid identity email");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      if (args.email === TEST_EMAIL && existing.subscriptionTier !== "premium") {
        await ctx.db.patch(existing._id, {
          subscriptionTier: "premium",
        });
      }
      return existing._id;
    }

    const isTestUser = args.email === TEST_EMAIL;
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
 * Get or create guest/test user from email and name.
 * Only `@guest.marginalia` and `test@example.com` are allowed.
 */
export const getOrCreateUserFromEmail = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isAllowedGuestOrTestEmail(args.email)) {
      throw new Error("Guest sign-up is restricted to local guest accounts");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      if (args.email === TEST_EMAIL && existing.subscriptionTier !== "premium") {
        await ctx.db.patch(existing._id, {
          subscriptionTier: "premium",
        });
      }
      return existing._id;
    }

    const isTestUser = args.email === TEST_EMAIL;
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
    const testEmail = TEST_EMAIL;
    const testName = "Test User";

    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", testEmail))
      .first();

    if (existing) {
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
 * Reassign all data from a guest profile to the currently signed-in user, then delete the guest.
 */
export const mergeGuestIntoAuthedUser = mutation({
  args: { guestUserId: v.id("users") },
  handler: async (ctx, args) => {
    const authedId = await getAuthUserId(ctx);
    if (authedId === null) {
      throw new Error("Not signed in");
    }

    const guest = await ctx.db.get(args.guestUserId);
    if (!guest || !guest.email?.endsWith(GUEST_EMAIL_SUFFIX)) {
      throw new Error("Invalid guest user");
    }

    if (args.guestUserId === authedId) {
      return { merged: false as const };
    }

    const guestId = args.guestUserId;

    // folders
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_owner", (q) => q.eq("ownerId", guestId))
      .collect();
    for (const f of folders) {
      await ctx.db.patch(f._id, { ownerId: authedId });
    }

    // notes
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_owner", (q) => q.eq("ownerId", guestId))
      .collect();
    for (const n of notes) {
      await ctx.db.patch(n._id, { ownerId: authedId });
    }

    // notePermissions
    const perms = await ctx.db
      .query("notePermissions")
      .withIndex("by_user", (q) => q.eq("userId", guestId))
      .collect();
    for (const p of perms) {
      const existing = await ctx.db
        .query("notePermissions")
        .withIndex("by_note_and_user", (q) =>
          q.eq("noteId", p.noteId).eq("userId", authedId)
        )
        .first();
      if (existing) {
        await ctx.db.delete(p._id);
      } else {
        await ctx.db.patch(p._id, { userId: authedId });
      }
    }

    // comments (author + resolvedBy)
    const comments = await ctx.db.query("comments").collect();
    for (const c of comments) {
      const patch: { authorId?: Id<"users">; resolvedBy?: Id<"users"> } = {};
      if (c.authorId === guestId) {
        patch.authorId = authedId;
      }
      if (c.resolvedBy === guestId) {
        patch.resolvedBy = authedId;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(c._id, patch);
      }
    }

    // activityEvents
    const activities = await ctx.db.query("activityEvents").collect();
    for (const ev of activities) {
      if (ev.actorId === guestId) {
        await ctx.db.patch(ev._id, { actorId: authedId });
      }
    }

    // presence
    const presences = await ctx.db.query("presence").collect();
    for (const pr of presences) {
      if (pr.userId !== guestId) continue;
      const existing = await ctx.db
        .query("presence")
        .withIndex("by_note_and_user", (q) =>
          q.eq("noteId", pr.noteId).eq("userId", authedId)
        )
        .first();
      if (existing) {
        await ctx.db.delete(pr._id);
      } else {
        await ctx.db.patch(pr._id, { userId: authedId });
      }
    }

    // aiConversations
    const convos = await ctx.db.query("aiConversations").collect();
    for (const conv of convos) {
      if (conv.userId === guestId) {
        const existing = await ctx.db
          .query("aiConversations")
          .withIndex("by_note_and_user", (q) =>
            q.eq("noteId", conv.noteId).eq("userId", authedId)
          )
          .first();
        if (existing) {
          await ctx.db.delete(conv._id);
        } else {
          await ctx.db.patch(conv._id, { userId: authedId });
        }
      }
    }

    await ctx.db.delete(guestId);

    return { merged: true as const };
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
