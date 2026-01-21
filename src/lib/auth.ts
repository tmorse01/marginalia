import { useMutation, useQuery, useConvexAuth } from 'convex/react'
import { useEffect, useRef, useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from 'convex/_generated/api'
import { useAuthFlag } from './feature-flags'
import type { Id } from 'convex/_generated/dataModel'

/**
 * Get the current authenticated user ID
 * Returns undefined while loading, null when not authenticated, or Id<'users'> when authenticated
 * Uses Convex Auth to get the authenticated user
 * 
 * Returns null immediately if auth feature flag is disabled
 */
export function useCurrentUser(): Id<'users'> | null | undefined {
  const authEnabled = useAuthFlag()
  
  // If auth is disabled, return null immediately (not authenticated)
  if (!authEnabled) {
    return null
  }
  
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  
  // Log Convex URL on first render to help debug
  useEffect(() => {
    const convexUrl = import.meta.env.VITE_CONVEX_URL
    console.log('[AUTH DEBUG] Convex URL configured:', convexUrl ? 'YES' : 'NO', convexUrl ? `(${convexUrl})` : '')
  }, [])
  
  // Get user ID from authenticated identity using query + mutation
  // Try to get auth user identity even when not authenticated to see what's happening
  const authUserIdentity = useQuery(
    api.auth.getCurrentUserIdentity,
    {}
  )
  const getOrCreateUser = useMutation(api.users.getOrCreateUserFromEmail)
  const [authenticatedUserId, setAuthenticatedUserId] = useState<Id<'users'> | null | undefined>(undefined)
  const hasFetchedUserId = useRef(false)
  
  // Debug: Log auth state changes
  useEffect(() => {
    console.log('[AUTH DEBUG] Auth state:', {
      isAuthenticated,
      authLoading,
      authUserIdentity: authUserIdentity === undefined ? 'loading' : authUserIdentity === null ? 'null' : 'exists',
      authenticatedUserId,
    })
  }, [isAuthenticated, authLoading, authUserIdentity, authenticatedUserId])
  
  useEffect(() => {
    // Reset fetch flag when auth state changes significantly
    if (!authLoading) {
      // If we have an auth user identity, create/get user
      if (authUserIdentity && !hasFetchedUserId.current) {
        hasFetchedUserId.current = true
        
        // Extract email and name from auth user
        const email = (authUserIdentity as any).email || (authUserIdentity as any).name || "unknown"
        const name = (authUserIdentity as any).name || (authUserIdentity as any).email || "Unknown User"
        
        console.log('[AUTH DEBUG] Creating/getting user from identity:', { email, name, isAuthenticated })
        
        getOrCreateUser({ email, name })
          .then((userId) => {
            console.log('[AUTH DEBUG] User created/found:', userId)
            setAuthenticatedUserId(userId)
            hasFetchedUserId.current = false // Allow refetch if identity changes
          })
          .catch((error) => {
            console.error('[AUTH DEBUG] Failed to get/create user:', error)
            setAuthenticatedUserId(null)
            hasFetchedUserId.current = false
          })
      } 
      // If authUserIdentity is null and we're not loading, user is not authenticated
      else if (authUserIdentity === null && authenticatedUserId === undefined) {
        // Only set to null if we haven't set it yet (initial state)
        setAuthenticatedUserId(null)
        hasFetchedUserId.current = false
      }
      // If we had a userId but now authUserIdentity is null, user signed out
      else if (authUserIdentity === null && authenticatedUserId !== null && authenticatedUserId !== undefined) {
        console.log('[AUTH DEBUG] User signed out, resetting state')
        setAuthenticatedUserId(null)
        hasFetchedUserId.current = false
      }
    }
  }, [isAuthenticated, authLoading, authUserIdentity, getOrCreateUser, authenticatedUserId])

  // If authUserIdentity is null, user is definitely not authenticated
  // Return null (not loading, just not authenticated)
  if (authUserIdentity === null) {
    return authenticatedUserId ?? null
  }
  
  // Return undefined while loading:
  // - Auth is loading
  // - We have an authUserIdentity but haven't created/fetched the user yet
  // - We're waiting for authUserIdentity query to resolve
  const isLoading = authLoading || 
    (authUserIdentity !== undefined && authenticatedUserId === undefined) ||
    (authUserIdentity === undefined && authLoading) // Only wait if auth is still loading
  
  // If loading, return undefined. Otherwise return userId or null if not authenticated
  if (isLoading) {
    return undefined
  }
  
  return authenticatedUserId ?? null
}

/**
 * Get auth actions for sign in/out
 */
export { useAuthActions }
