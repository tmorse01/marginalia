import { ConvexReactClient } from "convex/react";

// This will be set from environment variables
// VITE_CONVEX_URL should be your .convex.cloud URL (for the main client)
const convexUrl = import.meta.env.VITE_CONVEX_URL || "";

if (!convexUrl) {
  console.warn(
    "VITE_CONVEX_URL is not set. Convex features will not work until this is configured."
  );
}

// Validate that the URL is a .convex.cloud URL (not .convex.site)
if (convexUrl && convexUrl.endsWith('.convex.site')) {
  const errorMessage = 
    "VITE_CONVEX_URL should be a .convex.cloud URL, not .convex.site.\n" +
    ".convex.site URLs are for HTTP Actions only.\n" +
    "Please set VITE_CONVEX_URL to your .convex.cloud deployment URL.\n" +
    "For OAuth redirects, use VITE_CONVEX_AUTH_URL with your .convex.site URL.";
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const convex = new ConvexReactClient(convexUrl);

