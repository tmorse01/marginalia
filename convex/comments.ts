import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    noteId: v.id("notes"),
    authorId: v.id("users"),
    body: v.string(),
    anchorStart: v.number(),
    anchorEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      noteId: args.noteId,
      authorId: args.authorId,
      body: args.body,
      anchorStart: args.anchorStart,
      anchorEnd: args.anchorEnd,
      resolved: false,
      createdAt: Date.now(),
    });

    return commentId;
  },
});

export const resolve = mutation({
  args: {
    commentId: v.id("comments"),
    resolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.commentId, { resolved: args.resolved });
  },
});

export const list = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();

    // Fetch author details
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author ? { name: author.name, email: author.email } : null,
        };
      })
    );

    return commentsWithAuthors.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const listUnresolved = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_note_and_resolved", (q) =>
        q.eq("noteId", args.noteId).eq("resolved", false)
      )
      .collect();

    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author ? { name: author.name, email: author.email } : null,
        };
      })
    );

    return commentsWithAuthors.sort((a, b) => a.createdAt - b.createdAt);
  },
});

