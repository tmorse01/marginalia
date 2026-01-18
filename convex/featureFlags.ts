/**
 * Feature flags management in Convex
 * Allows runtime toggling of features without rebuilds
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get a feature flag value by key
 * Returns the flag value, or a default if the flag doesn't exist
 */
export const get = query({
  args: {
    key: v.string(),
    defaultValue: v.optional(v.boolean()),
  },
  handler: async ({ db }, { key, defaultValue = false }) => {
    const flag = await db
      .query("featureFlags")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    return flag?.value ?? defaultValue;
  },
});

/**
 * Get all feature flags
 */
export const getAll = query({
  handler: async ({ db }) => {
    const flags = await db.query("featureFlags").collect();
    return flags.reduce(
      (acc, flag) => {
        acc[flag.key] = flag.value;
        return acc;
      },
      {} as Record<string, boolean>
    );
  },
});

/**
 * Set a feature flag value
 * TODO: Add authorization check - only admins should be able to set flags
 * 
 * You can call this from the Convex dashboard or via the API
 */
export const set = mutation({
  args: {
    key: v.string(),
    value: v.boolean(),
    description: v.optional(v.string()),
  },
  handler: async ({ db }, { key, value, description }) => {
    // TODO: Add authorization check when auth is properly set up
    // For now, allow setting flags (you should restrict this in production)
    
    const existing = await db
      .query("featureFlags")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();

    if (existing) {
      await db.patch(existing._id, {
        value,
        description,
        updatedAt: Date.now(),
      });
    } else {
      await db.insert("featureFlags", {
        key,
        value,
        description,
        updatedAt: Date.now(),
      });
    }
  },
});
