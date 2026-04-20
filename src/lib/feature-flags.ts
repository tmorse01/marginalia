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
const ENABLE_AI_CHAT_ENV = import.meta.env.VITE_ENABLE_AI_CHAT === 'true';

/**
 * Hook to get the inline editor feature flag from Convex
 * Falls back to environment variable if Convex flag is not set
 * 
 * During SSR, always uses environment variable since ConvexProvider is not available
 * 
 * Note: Requires `npx convex dev` to be running to generate the API types
 * The hook will work at runtime even if types aren't generated yet
 * 
 * @returns boolean - true if inline editor should be enabled
 */
export function useInlineEditorFlag(): boolean {
  const isBrowser = typeof window !== 'undefined'

  // Always call useQuery (Rules of Hooks / SSR). Skip on the server; never return early
  // before hooks — that produced a different hook count between SSR and the client.
  const convexFlag = useQuery(
    api.featureFlags.get,
    isBrowser
      ? { key: 'inline_editor', defaultValue: ENABLE_INLINE_EDITOR_ENV }
      : 'skip'
  )

  if (!isBrowser || convexFlag === undefined) {
    return ENABLE_INLINE_EDITOR_ENV
  }

  return convexFlag
}

/**
 * Hook to get the AI chat feature flag from Convex
 * Falls back to environment variable if Convex flag is not set
 * 
 * During SSR, always uses environment variable since ConvexProvider is not available
 * 
 * Note: Requires `npx convex dev` to be running to generate the API types
 * The hook will work at runtime even if types aren't generated yet
 * 
 * @returns boolean - true if AI chat should be enabled
 */
export function useAIChatFlag(): boolean {
  const isBrowser = typeof window !== 'undefined'

  const convexFlag = useQuery(
    api.featureFlags.get,
    isBrowser
      ? { key: 'ai_chat', defaultValue: ENABLE_AI_CHAT_ENV }
      : 'skip'
  )

  if (!isBrowser || convexFlag === undefined) {
    return ENABLE_AI_CHAT_ENV
  }

  return convexFlag
}

/**
 * Build-time constant for use outside React components
 * Uses environment variable only (for SSR or non-React code)
 * 
 * For React components, prefer useInlineEditorFlag() hook
 */
export const ENABLE_INLINE_EDITOR = ENABLE_INLINE_EDITOR_ENV;

/**
 * Build-time constant for AI chat (for use outside React components)
 * Uses environment variable only (for SSR or non-React code)
 * 
 * For React components, prefer useAIChatFlag() hook
 */
export const ENABLE_AI_CHAT = ENABLE_AI_CHAT_ENV;
