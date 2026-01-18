import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ACTIVE_WINDOW_MS = 15_000;

export const getActiveUsers = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const activeSince = now - ACTIVE_WINDOW_MS;

    const entries = await ctx.db
      .query("presence")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .filter((q) => q.gte(q.field("updatedAt"), activeSince))
      .collect();

    const users = await Promise.all(
      entries.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        return {
          ...entry,
          user,
        };
      })
    );

    return users;
  },
});

export const upsert = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.id("users"),
    mode: v.union(v.literal("editing"), v.literal("viewing")),
    cursorStart: v.optional(v.number()),
    cursorEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_note_and_user", (q) =>
        q.eq("noteId", args.noteId).eq("userId", args.userId)
      )
      .first();

    const payload = {
      noteId: args.noteId,
      userId: args.userId,
      mode: args.mode,
      cursorStart: args.cursorStart,
      cursorEnd: args.cursorEnd,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("presence", payload);
  },
});

export const remove = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_note_and_user", (q) =>
        q.eq("noteId", args.noteId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

