/**
 * Feature flags for the application
 * 
 * Supports two modes:
 * 1. Build-time flags via Vite environment variables (simple, requires rebuild)
 * 2. Runtime flags via Convex (dynamic, no rebuild needed)
 * 
 * Priority: Convex flags override env vars if available
 */

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Build-time fallback from environment variable
 * Used when Convex is not available or flag hasn't been set in Convex
 */
const ENABLE_INLINE_EDITOR_ENV = import.meta.env.VITE_ENABLE_INLINE_EDITOR === 'true';

/**
 * Hook to get the inline editor feature flag from Convex
 * Falls back to environment variable if Convex flag is not set
 * 
 * Note: Requires `npx convex dev` to be running to generate the API types
 * The hook will work at runtime even if types aren't generated yet
 * 
 * @returns boolean - true if inline editor should be enabled
 */
export function useInlineEditorFlag(): boolean {
  // Try to get flag from Convex (runtime, can be toggled without rebuild)
  // Type assertion needed until Convex generates API types (run `npx convex dev`)
  const featureFlagsAPI = (api as any).featureFlags;
  
  if (!featureFlagsAPI?.get) {
    // Convex API not available yet, use env var
    return ENABLE_INLINE_EDITOR_ENV;
  }

  const convexFlag = useQuery(featureFlagsAPI.get, {
    key: "inline_editor",
    defaultValue: ENABLE_INLINE_EDITOR_ENV, // Fallback to env var
  });

  // If Convex query is loading or failed, fall back to env var
  if (convexFlag === undefined) {
    return ENABLE_INLINE_EDITOR_ENV;
  }

  return convexFlag;
}

/**
 * Build-time constant for use outside React components
 * Uses environment variable only (for SSR or non-React code)
 * 
 * For React components, prefer useInlineEditorFlag() hook
 */
export const ENABLE_INLINE_EDITOR = ENABLE_INLINE_EDITOR_ENV;
