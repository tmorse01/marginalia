import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const log = mutation({
  args: {
    noteId: v.id("notes"),
    type: v.union(
      v.literal("edit"),
      v.literal("comment"),
      v.literal("resolve"),
      v.literal("fork"),
      v.literal("permission")
    ),
    actorId: v.id("users"),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("activityEvents", {
      noteId: args.noteId,
      type: args.type,
      actorId: args.actorId,
      metadata: args.metadata || {},
      createdAt: Date.now(),
    });

    return eventId;
  },
});

export const getNoteActivity = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("activityEvents")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();

    // Fetch actor details
    const eventsWithActors = await Promise.all(
      events.map(async (event) => {
        const actor = await ctx.db.get(event.actorId);
        return {
          ...event,
          actor: actor ? { name: actor.name, email: actor.email } : null,
        };
      })
    );

    return eventsWithActors.sort((a, b) => b.createdAt - a.createdAt);
  },
});

