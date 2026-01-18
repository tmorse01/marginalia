import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  notes: defineTable({
    title: v.string(),
    content: v.string(), // markdown
    ownerId: v.id("users"),
    visibility: v.union(v.literal("private"), v.literal("shared"), v.literal("public")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_visibility", ["visibility"]),

  notePermissions: defineTable({
    noteId: v.id("notes"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
  })
    .index("by_note", ["noteId"])
    .index("by_user", ["userId"])
    .index("by_note_and_user", ["noteId", "userId"]),

  comments: defineTable({
    noteId: v.id("notes"),
    authorId: v.id("users"),
    body: v.string(),

    // Line-based anchoring (GitHub PR style)
    lineNumber: v.optional(v.number()), // 0-indexed line number (optional for migration)
    lineContent: v.optional(v.string()), // Snapshot of line content when commented

    // Legacy fields (deprecated, kept for migration)
    anchorStart: v.optional(v.number()),
    anchorEnd: v.optional(v.number()),

    // Threading support
    parentId: v.optional(v.id("comments")), // For replies

    // Resolution status
    resolved: v.boolean(),
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),

    // Timestamps
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_note", ["noteId"])
    .index("by_note_and_resolved", ["noteId", "resolved"])
    .index("by_parent", ["parentId"]),

  activityEvents: defineTable({
    noteId: v.id("notes"),
    type: v.union(
      v.literal("edit"),
      v.literal("comment"),
      v.literal("resolve"),
      v.literal("fork"),
      v.literal("permission")
    ),
    actorId: v.id("users"),
    metadata: v.any(), // flexible metadata for different event types
    createdAt: v.number(),
  })
    .index("by_note", ["noteId"])
    .index("by_note_and_created", ["noteId", "createdAt"]),

  presence: defineTable({
    noteId: v.id("notes"),
    userId: v.id("users"),
    mode: v.union(v.literal("editing"), v.literal("viewing")),
    cursorStart: v.optional(v.number()),
    cursorEnd: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_note", ["noteId"])
    .index("by_note_and_user", ["noteId", "userId"]),
});

