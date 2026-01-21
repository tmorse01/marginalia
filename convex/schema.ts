import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
    subscriptionTier: v.optional(v.string()), // e.g., "free", "premium", "enterprise" - determines feature access
  })
    .index("by_email", ["email"]),

  folders: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    parentId: v.optional(v.id("folders")),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_parent", ["parentId"])
    .index("by_owner_and_parent", ["ownerId", "parentId"]),

  notes: defineTable({
    title: v.string(),
    content: v.string(), // markdown
    ownerId: v.id("users"),
    folderId: v.optional(v.id("folders")),
    order: v.optional(v.number()), // Optional for migration - will be backfilled
    visibility: v.union(v.literal("private"), v.literal("shared"), v.literal("public")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_visibility", ["visibility"])
    .index("by_folder", ["folderId"]),

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
      v.literal("permission"),
      v.literal("delete")
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

  featureFlags: defineTable({
    key: v.string(), // e.g., "inline_editor"
    value: v.boolean(),
    description: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()), // Store user identifier (email or tokenIdentifier)
  })
    .index("by_key", ["key"]),

  aiConversations: defineTable({
    noteId: v.id("notes"),
    userId: v.id("users"),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
      content: v.string(),
      timestamp: v.number(),
      suggestionId: v.optional(v.string()), // For linking suggestions to messages
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_note", ["noteId"])
    .index("by_note_and_user", ["noteId", "userId"]),
});

