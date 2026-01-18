import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to check if user has access to a note
async function checkNoteAccess(
  ctx: any,
  noteId: any,
  userId: any
): Promise<{ hasAccess: boolean; role: "owner" | "editor" | "viewer" | null; note: any }> {
  const note = await ctx.db.get(noteId);
  if (!note) {
    return { hasAccess: false, role: null, note: null };
  }

  // Check if user is owner
  if (note.ownerId === userId) {
    return { hasAccess: true, role: "owner", note };
  }

  // Check permissions table
  const permission = await ctx.db
    .query("notePermissions")
    .withIndex("by_note_and_user", (q: any) =>
      q.eq("noteId", noteId).eq("userId", userId)
    )
    .first();

  if (permission) {
    return { hasAccess: true, role: permission.role, note };
  }

  // Check if note is public
  if (note.visibility === "public") {
    return { hasAccess: true, role: "viewer", note };
  }

  return { hasAccess: false, role: null, note };
}

/**
 * Create a new comment on a specific line or as a general comment
 * Omit lineNumber and lineContent for general comments not tied to a specific line
 */
export const create = mutation({
  args: {
    noteId: v.id("notes"),
    authorId: v.id("users"),
    body: v.string(),
    lineNumber: v.optional(v.number()), // undefined for general comments
    lineContent: v.optional(v.string()), // undefined for general comments
  },
  handler: async (ctx, args) => {
    // Validate body is not empty
    if (!args.body.trim()) {
      throw new Error("Comment body cannot be empty");
    }

    // Check user has access to the note
    const { hasAccess, note } = await checkNoteAccess(ctx, args.noteId, args.authorId);
    if (!hasAccess) {
      throw new Error("You don't have permission to comment on this note");
    }

    // Validate line number is within bounds (unless it's a general comment)
    const isGeneralComment = args.lineNumber === undefined;
    if (!isGeneralComment && args.lineNumber !== undefined) {
      const lines = note.content.split("\n");
      if (args.lineNumber < 0 || args.lineNumber >= lines.length) {
        throw new Error("Invalid line number");
      }
    }

    const commentId = await ctx.db.insert("comments", {
      noteId: args.noteId,
      authorId: args.authorId,
      body: args.body.trim(),
      lineNumber: args.lineNumber,
      lineContent: args.lineContent,
      resolved: false,
      createdAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityEvents", {
      noteId: args.noteId,
      type: "comment",
      actorId: args.authorId,
      metadata: { 
        lineNumber: isGeneralComment ? null : args.lineNumber, 
        commentId,
        isGeneral: isGeneralComment,
      },
      createdAt: Date.now(),
    });

    return commentId;
  },
});

/**
 * Get the effective line number for a comment (handles legacy comments)
 * Returns undefined for general comments (no line association)
 */
function getEffectiveLineNumber(comment: any, noteContent: string): number | undefined {
  // New-style comment with lineNumber
  if (comment.lineNumber !== undefined) {
    return comment.lineNumber;
  }
  
  // Legacy comment with anchorStart - convert to line number
  if (comment.anchorStart !== undefined) {
    const lines = noteContent.split("\n");
    let charCount = 0;
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= comment.anchorStart) {
        return i;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }
    return 0;
  }
  
  // General comment - no line association
  return undefined;
}

/**
 * Get the effective line content for a comment (handles legacy comments)
 * Returns undefined for general comments (no line association)
 */
function getEffectiveLineContent(comment: any, noteContent: string): string | undefined {
  // New-style comment with lineContent
  if (comment.lineContent !== undefined) {
    return comment.lineContent;
  }
  
  // Legacy comment - extract from anchorStart/anchorEnd
  if (comment.anchorStart !== undefined && comment.anchorEnd !== undefined) {
    return noteContent.substring(comment.anchorStart, comment.anchorEnd);
  }
  
  // Fallback: get line content from computed line number
  const lineNum = getEffectiveLineNumber(comment, noteContent);
  if (lineNum === undefined) {
    return undefined; // General comment
  }
  const lines = noteContent.split("\n");
  return lines[lineNum] || "";
}

/**
 * Reply to an existing comment (creates a threaded reply)
 */
export const reply = mutation({
  args: {
    parentId: v.id("comments"),
    authorId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate body is not empty
    if (!args.body.trim()) {
      throw new Error("Reply body cannot be empty");
    }

    // Get parent comment
    const parent = await ctx.db.get(args.parentId);
    if (!parent) {
      throw new Error("Parent comment not found");
    }

    // Don't allow replies to replies (only one level of nesting)
    if (parent.parentId) {
      throw new Error("Cannot reply to a reply. Reply to the original comment instead.");
    }

    // Check user has access to the note
    const { hasAccess } = await checkNoteAccess(ctx, parent.noteId, args.authorId);
    if (!hasAccess) {
      throw new Error("You don't have permission to reply to this comment");
    }

    const replyId = await ctx.db.insert("comments", {
      noteId: parent.noteId,
      authorId: args.authorId,
      body: args.body.trim(),
      lineNumber: parent.lineNumber,
      lineContent: parent.lineContent,
      parentId: args.parentId,
      resolved: false,
      createdAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("activityEvents", {
      noteId: parent.noteId,
      type: "comment",
      actorId: args.authorId,
      metadata: { lineNumber: parent.lineNumber, commentId: replyId, isReply: true },
      createdAt: Date.now(),
    });

    return replyId;
  },
});

/**
 * Update a comment's body (author only)
 */
export const update = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.id("users"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Only author can edit
    if (comment.authorId !== args.userId) {
      throw new Error("Only the comment author can edit this comment");
    }

    // Validate body is not empty
    if (!args.body.trim()) {
      throw new Error("Comment body cannot be empty");
    }

    await ctx.db.patch(args.commentId, {
      body: args.body.trim(),
      editedAt: Date.now(),
    });
  },
});

/**
 * Delete a comment (author or note owner only)
 */
export const remove = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if user is author or note owner
    const { role } = await checkNoteAccess(ctx, comment.noteId, args.userId);
    const isAuthor = comment.authorId === args.userId;
    const isOwnerOrEditor = role === "owner" || role === "editor";

    if (!isAuthor && !isOwnerOrEditor) {
      throw new Error("You don't have permission to delete this comment");
    }

    // If this is a parent comment, also delete all replies
    if (!comment.parentId) {
      const replies = await ctx.db
        .query("comments")
        .withIndex("by_parent", (q) => q.eq("parentId", args.commentId))
        .collect();

      for (const replyComment of replies) {
        await ctx.db.delete(replyComment._id);
      }
    }

    await ctx.db.delete(args.commentId);
  },
});

/**
 * Resolve or unresolve a comment thread
 * Only the comment author, note editor, or note owner can resolve
 */
export const resolve = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.id("users"),
    resolved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Can't resolve a reply directly - resolve the parent instead
    if (comment.parentId) {
      throw new Error("Cannot resolve a reply. Resolve the parent comment instead.");
    }

    // Check if user is author or has edit permissions
    const { role } = await checkNoteAccess(ctx, comment.noteId, args.userId);
    const isAuthor = comment.authorId === args.userId;
    const canResolve = isAuthor || role === "owner" || role === "editor";

    if (!canResolve) {
      throw new Error("You don't have permission to resolve this comment");
    }

    await ctx.db.patch(args.commentId, {
      resolved: args.resolved,
      resolvedBy: args.resolved ? args.userId : undefined,
      resolvedAt: args.resolved ? Date.now() : undefined,
    });

    // Log activity
    await ctx.db.insert("activityEvents", {
      noteId: comment.noteId,
      type: "resolve",
      actorId: args.userId,
      metadata: {
        commentId: args.commentId,
        lineNumber: comment.lineNumber,
        resolved: args.resolved,
      },
      createdAt: Date.now(),
    });
  },
});

/**
 * List all comments for a note, grouped by line number with threading
 */
export const listByNote = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    // Get note content for legacy comment conversion
    const note = await ctx.db.get(args.noteId);
    const noteContent = note?.content || "";

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();

    // Enrich with author details and normalize line numbers
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        const resolvedByUser = comment.resolvedBy
          ? await ctx.db.get(comment.resolvedBy)
          : null;

        // Normalize line number and content for legacy comments
        const lineNumber = getEffectiveLineNumber(comment, noteContent);
        const lineContent = getEffectiveLineContent(comment, noteContent);

        return {
          ...comment,
          lineNumber,
          lineContent,
          author: author ? { name: author.name, email: author.email } : null,
          resolvedByUser: resolvedByUser
            ? { name: resolvedByUser.name, email: resolvedByUser.email }
            : null,
        };
      })
    );

    // Separate top-level comments and replies
    const topLevel = enrichedComments.filter((c) => !c.parentId);
    const replies = enrichedComments.filter((c) => c.parentId);

    // Build threads (attach replies to parents)
    const threads = topLevel.map((comment) => ({
      ...comment,
      replies: replies
        .filter((r) => r.parentId === comment._id)
        .sort((a, b) => a.createdAt - b.createdAt),
    }));

    // Separate general comments (no lineNumber) from line-specific comments
    const generalComments = threads.filter(
      (t) => t.lineNumber === undefined || t.lineNumber === null
    );
    const lineComments = threads.filter(
      (t) => t.lineNumber !== undefined && t.lineNumber !== null
    );

    // Group line comments by line number
    const byLine = lineComments.reduce<Record<number, typeof threads>>(
      (acc, thread) => {
        const line = thread.lineNumber as number;
        if (!(line in acc)) {
          acc[line] = [];
        }
        acc[line].push(thread);
        return acc;
      },
      {}
    );

    // Sort threads within each line by creation time
    Object.keys(byLine).forEach((lineKey) => {
      byLine[Number(lineKey)].sort((a, b) => a.createdAt - b.createdAt);
    });

    // Sort general comments by creation time
    generalComments.sort((a, b) => a.createdAt - b.createdAt);

    return { byLine, general: generalComments };
  },
});

/**
 * List comments for a specific line
 */
export const listByLine = query({
  args: {
    noteId: v.id("notes"),
    lineNumber: v.number(),
  },
  handler: async (ctx, args) => {
    // Get note content for legacy comment conversion
    const note = await ctx.db.get(args.noteId);
    const noteContent = note?.content || "";

    // Get all comments for the note and filter by effective line number
    const allComments = await ctx.db
      .query("comments")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();

    // Filter to comments on this line (including legacy comments)
    const comments = allComments.filter((comment) => {
      const effectiveLine = getEffectiveLineNumber(comment, noteContent);
      return effectiveLine === args.lineNumber;
    });

    // Enrich with author details
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        const lineNumber = getEffectiveLineNumber(comment, noteContent);
        const lineContent = getEffectiveLineContent(comment, noteContent);
        return {
          ...comment,
          lineNumber,
          lineContent,
          author: author ? { name: author.name, email: author.email } : null,
        };
      })
    );

    // Separate top-level comments and replies
    const topLevel = enrichedComments.filter((c) => !c.parentId);
    const replies = enrichedComments.filter((c) => c.parentId);

    // Build threads
    return topLevel
      .map((comment) => ({
        ...comment,
        replies: replies
          .filter((r) => r.parentId === comment._id)
          .sort((a, b) => a.createdAt - b.createdAt),
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

/**
 * Get a single comment with its replies
 */
export const getThread = query({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      return null;
    }

    // If this is a reply, get the parent instead
    const parentComment = comment.parentId
      ? await ctx.db.get(comment.parentId)
      : comment;

    if (!parentComment) {
      return null;
    }

    // Get author
    const author = await ctx.db.get(parentComment.authorId);

    // Get replies
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", parentComment._id))
      .collect();

    const enrichedReplies = await Promise.all(
      replies.map(async (replyItem) => {
        const replyAuthor = await ctx.db.get(replyItem.authorId);
        return {
          ...replyItem,
          author: replyAuthor
            ? { name: replyAuthor.name, email: replyAuthor.email }
            : null,
        };
      })
    );

    return {
      ...parentComment,
      author: author ? { name: author.name, email: author.email } : null,
      replies: enrichedReplies.sort((a, b) => a.createdAt - b.createdAt),
    };
  },
});

/**
 * Get count of unresolved comments per line (for gutter badges)
 */
export const getUnresolvedCounts = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    // Get note content for legacy comment conversion
    const note = await ctx.db.get(args.noteId);
    const noteContent = note?.content || "";

    const comments = await ctx.db
      .query("comments")
      .withIndex("by_note_and_resolved", (q) =>
        q.eq("noteId", args.noteId).eq("resolved", false)
      )
      .collect();

    // Only count top-level comments (not replies)
    const topLevel = comments.filter((c) => !c.parentId);

    // Count by line (using effective line number for legacy comments)
    // Skip general comments (no line number)
    const counts: Record<number, number> = {};
    for (const comment of topLevel) {
      const lineNum = getEffectiveLineNumber(comment, noteContent);
      if (lineNum !== undefined) {
        counts[lineNum] = (counts[lineNum] || 0) + 1;
      }
    }

    return counts;
  },
});

/**
 * Legacy: List all comments (flat, for backward compatibility)
 * @deprecated Use listByNote instead
 */
export const list = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
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
