import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const noteId = await ctx.db.insert("notes", {
      title: args.title,
      content: args.content,
      ownerId: args.ownerId,
      visibility: "private",
      createdAt: now,
      updatedAt: now,
    });

    // Create owner permission
    await ctx.db.insert("notePermissions", {
      noteId,
      userId: args.ownerId,
      role: "owner",
    });

    return noteId;
  },
});

export const get = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.noteId);
  },
});

export const update = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("private"), v.literal("shared"), v.literal("public"))),
  },
  handler: async (ctx, args) => {
    const updates: {
      title?: string;
      content?: string;
      visibility?: "private" | "shared" | "public";
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.content !== undefined) {
      updates.content = args.content;
    }
    if (args.visibility !== undefined) {
      updates.visibility = args.visibility;
    }

    await ctx.db.patch(args.noteId, updates);
  },
});

export const listUserNotes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get notes where user is owner
    const ownedNotes = await ctx.db
      .query("notes")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();

    // Get notes where user has permissions
    const permissionedNotes = await ctx.db
      .query("notePermissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const permissionedNoteIds = new Set(
      permissionedNotes.map((p) => p.noteId)
    );

    // Fetch the actual notes
    const sharedNotes = await Promise.all(
      Array.from(permissionedNoteIds).map((noteId) => ctx.db.get(noteId))
    );

    // Combine and deduplicate
    const allNotes = [
      ...ownedNotes,
      ...sharedNotes.filter((n): n is NonNullable<typeof n> => n !== null),
    ];

    // Remove duplicates
    const uniqueNotes = Array.from(
      new Map(allNotes.map((n) => [n._id, n])).values()
    );

    return uniqueNotes.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const deleteNote = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    // Delete related permissions
    const permissions = await ctx.db
      .query("notePermissions")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();

    for (const perm of permissions) {
      await ctx.db.delete(perm._id);
    }

    // Delete related comments
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete related activity events
    const events = await ctx.db
      .query("activityEvents")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();

    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    // Delete the note
    await ctx.db.delete(args.noteId);
  },
});

export const getPublic = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (note && note.visibility === "public") {
      return note;
    }
    return null;
  },
});

