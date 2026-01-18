import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    ownerId: v.id("users"),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    // Get max order for siblings in the same folder
    const siblings = await ctx.db
      .query("notes")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId ?? undefined))
      .collect();

    const maxOrder = siblings.length > 0
      ? Math.max(...siblings.map((n) => n.order ?? 0))
      : -1;

    const now = Date.now();
    const noteId = await ctx.db.insert("notes", {
      title: args.title,
      content: args.content,
      ownerId: args.ownerId,
      folderId: args.folderId,
      order: maxOrder + 1,
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

    // Backfill order for notes that don't have it (migration)
    const notesWithOrder = uniqueNotes.map((note, index) => {
      if (note.order === undefined) {
        // Assign order based on current position (will be saved on next update)
        return { ...note, order: index };
      }
      return note;
    });

    // Sort by folder order, then by updatedAt
    return notesWithOrder.sort((a, b) => {
      // First sort by order if in same folder
      if (a.folderId === b.folderId) {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
      }
      // Then by updatedAt
      return b.updatedAt - a.updatedAt;
    });
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

export const moveToFolder = mutation({
  args: {
    noteId: v.id("notes"),
    folderId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) return;

    // Get max order in new folder
    const siblings = await ctx.db
      .query("notes")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId ?? undefined))
      .collect();

    const maxOrder = siblings.length > 0
      ? Math.max(...siblings.map((n) => n.order ?? 0))
      : -1;

    await ctx.db.patch(args.noteId, {
      folderId: args.folderId,
      order: maxOrder + 1,
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: {
    noteId: v.id("notes"),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) return;

    const siblings = await ctx.db
      .query("notes")
      .withIndex("by_folder", (q) => q.eq("folderId", note.folderId ?? undefined))
      .collect();

    const sorted = siblings.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const oldIndex = sorted.findIndex((n) => n._id === args.noteId);
    
    if (oldIndex === -1) return;

    sorted.splice(oldIndex, 1);
    sorted.splice(args.newOrder, 0, note);

    // Update all affected notes
    for (let i = 0; i < sorted.length; i++) {
      const currentOrder = sorted[i].order ?? 0;
      if (currentOrder !== i) {
        await ctx.db.patch(sorted[i]._id, {
          order: i,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

export const duplicate = mutation({
  args: {
    noteId: v.id("notes"),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.noteId);
    if (!original) return null;

    const now = Date.now();
    const newNoteId = await ctx.db.insert("notes", {
      title: `${original.title} (Copy)`,
      content: original.content,
      ownerId: args.ownerId,
      folderId: original.folderId,
      order: (original.order ?? 0) + 1, // Place right after original
      visibility: "private",
      createdAt: now,
      updatedAt: now,
    });

    // Create owner permission
    await ctx.db.insert("notePermissions", {
      noteId: newNoteId,
      userId: args.ownerId,
      role: "owner",
    });

    return newNoteId;
  },
});

