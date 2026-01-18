import { ConvexReactClient } from "convex/react";

// This will be set from environment variables
const convexUrl = import.meta.env.VITE_CONVEX_URL || "";

if (!convexUrl) {
  console.warn(
    "VITE_CONVEX_URL is not set. Convex features will not work until this is configured."
  );
}

export const convex = new ConvexReactClient(convexUrl);

