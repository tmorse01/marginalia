import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const grant = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    // Check if permission already exists
    const existing = await ctx.db
      .query("notePermissions")
      .withIndex("by_note_and_user", (q) =>
        q.eq("noteId", args.noteId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      // Update existing permission
      await ctx.db.patch(existing._id, { role: args.role });
      return existing._id;
    } else {
      // Create new permission
      const permissionId = await ctx.db.insert("notePermissions", {
        noteId: args.noteId,
        userId: args.userId,
        role: args.role,
      });
      return permissionId;
    }
  },
});

export const revoke = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const permission = await ctx.db
      .query("notePermissions")
      .withIndex("by_note_and_user", (q) =>
        q.eq("noteId", args.noteId).eq("userId", args.userId)
      )
      .first();

    if (permission) {
      await ctx.db.delete(permission._id);
    }
  },
});

export const check = query({
  args: {
    noteId: v.id("notes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is owner
    const note = await ctx.db.get(args.noteId);
    if (note && note.ownerId === args.userId) {
      return { role: "owner" as const, hasAccess: true };
    }

    // Check permissions
    const permission = await ctx.db
      .query("notePermissions")
      .withIndex("by_note_and_user", (q) =>
        q.eq("noteId", args.noteId).eq("userId", args.userId)
      )
      .first();

    if (permission) {
      return { role: permission.role, hasAccess: true };
    }

    // Check if note is public
    if (note && note.visibility === "public") {
      return { role: "viewer" as const, hasAccess: true };
    }

    return { role: null, hasAccess: false };
  },
});

export const list = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const permissions = await ctx.db
      .query("notePermissions")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();

    // Fetch user details for each permission
    const permissionsWithUsers = await Promise.all(
      permissions.map(async (perm) => {
        const user = await ctx.db.get(perm.userId);
        return {
          ...perm,
          user: user ? { name: user.name, email: user.email } : null,
        };
      })
    );

    return permissionsWithUsers;
  },
});

