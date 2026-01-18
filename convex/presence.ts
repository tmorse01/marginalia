import { v } from "convex/values";
import { query } from "./_generated/server";

// Presence tracking using a simple table approach for MVP
// This can be enhanced with Convex's built-in presence later
export const getActiveUsers = query({
  args: { noteId: v.id("notes") },
  handler: (_ctx, _args) => {
    // For MVP, we'll track presence in a separate table
    // This is a simplified approach - can be enhanced with Convex presence API
    // For now, return empty array - will be implemented with client-side presence updates
    return [];
  },
});

