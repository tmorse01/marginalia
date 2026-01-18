// Convex Auth setup
// Note: This will be configured when running `npx convex dev`
// For now, we'll use a simple auth pattern with email
import { query } from "./_generated/server";

// Simple auth helpers - can be enhanced with Convex Auth later
export const getCurrentUser = query({
  args: {},
  handler: (_ctx) => {
    // This will be replaced with proper auth when Convex Auth is configured
    // For MVP, we'll handle auth on the client side
    return null;
  },
});

