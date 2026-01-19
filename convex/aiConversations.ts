import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get conversation history for a note and user
 */
export const getConversation = query({
  args: {
    noteId: v.id("notes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("aiConversations")
      .withIndex("by_note_and_user", (q) =>
        q.eq("noteId", args.noteId).eq("userId", args.userId)
      )
      .first();

    return conversation;
  },
});

/**
 * Add a message to the conversation
 * Creates a new conversation if one doesn't exist
 */
export const addMessage = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    suggestionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if conversation exists
    const existing = await ctx.db
      .query("aiConversations")
      .withIndex("by_note_and_user", (q) =>
        q.eq("noteId", args.noteId).eq("userId", args.userId)
      )
      .first();

    const newMessage = {
      role: args.role,
      content: args.content,
      timestamp: now,
      suggestionId: args.suggestionId,
    };

    if (existing) {
      // Update existing conversation
      await ctx.db.patch(existing._id, {
        messages: [...existing.messages, newMessage],
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new conversation
      const conversationId = await ctx.db.insert("aiConversations", {
        noteId: args.noteId,
        userId: args.userId,
        messages: [newMessage],
        createdAt: now,
        updatedAt: now,
      });
      return conversationId;
    }
  },
});

/**
 * Clear conversation history for a note and user
 */
export const clearConversation = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db
      .query("aiConversations")
      .withIndex("by_note_and_user", (q) =>
        q.eq("noteId", args.noteId).eq("userId", args.userId)
      )
      .first();

    if (conversation) {
      await ctx.db.delete(conversation._id);
    }
  },
});
