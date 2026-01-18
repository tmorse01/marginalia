import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    ownerId: v.id("users"),
    parentId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    // Get max order for siblings
    const siblings = await ctx.db
      .query("folders")
      .withIndex("by_owner_and_parent", (q) =>
        q.eq("ownerId", args.ownerId).eq("parentId", args.parentId ?? undefined)
      )
      .collect();

    const maxOrder = siblings.length > 0 
      ? Math.max(...siblings.map((f) => f.order))
      : -1;

    const now = Date.now();
    const folderId = await ctx.db.insert("folders", {
      name: args.name,
      ownerId: args.ownerId,
      parentId: args.parentId,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });

    return folderId;
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const folders = await ctx.db
      .query("folders")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();

    return folders.sort((a, b) => a.order - b.order);
  },
});

export const update = mutation({
  args: {
    folderId: v.id("folders"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: {
      name?: string;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    await ctx.db.patch(args.folderId, updates);
  },
});

export const deleteFolder = mutation({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder) return;

    // Move child folders to parent (or root if no parent)
    const childFolders = await ctx.db
      .query("folders")
      .withIndex("by_parent", (q) => q.eq("parentId", args.folderId))
      .collect();

    for (const child of childFolders) {
      await ctx.db.patch(child._id, {
        parentId: folder.parentId,
        updatedAt: Date.now(),
      });
    }

    // Move child notes to parent folder (or root if no parent)
    const childNotes = await ctx.db
      .query("notes")
      .withIndex("by_folder", (q) => q.eq("folderId", args.folderId))
      .collect();

    for (const note of childNotes) {
      await ctx.db.patch(note._id, {
        folderId: folder.parentId,
        updatedAt: Date.now(),
      });
    }

    // Delete the folder
    await ctx.db.delete(args.folderId);
  },
});

export const move = mutation({
  args: {
    folderId: v.id("folders"),
    newParentId: v.optional(v.id("folders")),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder) return;

    // Prevent moving folder into itself or its descendants
    if (args.newParentId) {
      let currentParentId: string | undefined = args.newParentId;
      while (currentParentId) {
        if (currentParentId === args.folderId) {
          throw new Error("Cannot move folder into itself or its descendants");
        }
        // Query the folder to check its parent
        const parentFolder = await ctx.db
          .query("folders")
          .filter((q) => q.eq(q.field("_id"), currentParentId))
          .first();
        if (!parentFolder) {
          break;
        }
        currentParentId = parentFolder.parentId;
      }
    }

    const siblings = await ctx.db
      .query("folders")
      .withIndex("by_owner_and_parent", (q) =>
        q.eq("ownerId", folder.ownerId).eq("parentId", args.newParentId ?? undefined)
      )
      .collect();

    const maxOrder = siblings.length > 0
      ? Math.max(...siblings.map((f) => f.order))
      : -1;

    await ctx.db.patch(args.folderId, {
      parentId: args.newParentId,
      order: maxOrder + 1,
      updatedAt: Date.now(),
    });
  },
});

export const reorder = mutation({
  args: {
    folderId: v.id("folders"),
    newOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.folderId);
    if (!folder) return;

    const siblings = await ctx.db
      .query("folders")
      .withIndex("by_owner_and_parent", (q) =>
        q.eq("ownerId", folder.ownerId).eq("parentId", folder.parentId ?? undefined)
      )
      .collect();

    const sorted = siblings.sort((a, b) => a.order - b.order);
    const oldIndex = sorted.findIndex((f) => f._id === args.folderId);
    
    if (oldIndex === -1) return;

    sorted.splice(oldIndex, 1);
    sorted.splice(args.newOrder, 0, folder);

    // Update all affected folders
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].order !== i) {
        await ctx.db.patch(sorted[i]._id, {
          order: i,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

export const get = query({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.folderId);
  },
});

export const getPath = query({
  args: { folderId: v.id("folders") },
  handler: async (ctx, args) => {
    const path: Array<{ _id: string; name: string }> = [];
    let currentFolderId: string | undefined = args.folderId;
    
    while (currentFolderId) {
      const folder = await ctx.db
        .query("folders")
        .filter((q) => q.eq(q.field("_id"), currentFolderId))
        .first();
      if (!folder) break;
      
      path.unshift({ _id: folder._id, name: folder.name });
      currentFolderId = folder.parentId;
    }
    
    return path;
  },
});

