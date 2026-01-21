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

// Export auth URL separately (for HTTP Actions/OAuth redirects)
// This should be your .convex.site URL (different from the .convex.cloud client URL)
const authUrl = import.meta.env.VITE_CONVEX_AUTH_URL || "";

if (!authUrl && convexUrl) {
  // Warn if auth URL is not set but we have a client URL
  // This is OK if they're the same, but typically they're different
  console.warn(
    "VITE_CONVEX_AUTH_URL is not set. Falling back to VITE_CONVEX_URL for auth redirects. " +
    "If your HTTP Actions URL (.convex.site) differs from your deployment URL (.convex.cloud), " +
    "set VITE_CONVEX_AUTH_URL to your .convex.site URL."
  );
}

export const convexAuthUrl = authUrl || convexUrl;

