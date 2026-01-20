import { useMutation, useQuery, useConvexAuth } from 'convex/react'
import { useEffect, useRef, useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'

const TEST_USER_EMAIL = 'test@example.com'
const IS_DEV = false // Disabled for auth testing

/**
 * Get the current authenticated user ID
 * Returns undefined while loading, null when not authenticated, or Id<'users'> when authenticated
 * In development mode, falls back to test user with premium subscription
 * In production, uses Convex Auth
 */
export function useCurrentUser(): Id<'users'> | null | undefined {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  
  // Log Convex URL on first render to help debug
  useEffect(() => {
    const convexUrl = import.meta.env.VITE_CONVEX_URL
    console.log('[AUTH DEBUG] Convex URL configured:', convexUrl ? 'YES' : 'NO', convexUrl ? `(${convexUrl})` : '')
  }, [])
  
  // In production, get user ID from authenticated identity using query + mutation
  // Try to get auth user identity even when not authenticated to see what's happening
  const authUserIdentity = useQuery(
    api.auth.getCurrentUserIdentity,
    !IS_DEV ? {} : 'skip'
  )
  const getOrCreateUser = useMutation(api.users.getOrCreateUserFromEmail)
  const [authenticatedUserId, setAuthenticatedUserId] = useState<Id<'users'> | null | undefined>(undefined)
  const hasFetchedUserId = useRef(false)
  
  // Debug: Log auth state changes
  useEffect(() => {
    if (!IS_DEV) {
      console.log('[AUTH DEBUG] Auth state:', {
        isAuthenticated,
        authLoading,
        authUserIdentity: authUserIdentity === undefined ? 'loading' : authUserIdentity === null ? 'null' : 'exists',
        authenticatedUserId,
      })
    }
  }, [IS_DEV, isAuthenticated, authLoading, authUserIdentity, authenticatedUserId])
  
  useEffect(() => {
    // If we have an auth user identity (even if isAuthenticated is false due to sync delay), create/get user
    if (!IS_DEV && authUserIdentity && !hasFetchedUserId.current) {
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
    } else if (!IS_DEV && !authLoading && authUserIdentity === null && !hasFetchedUserId.current) {
      // User is not authenticated - set to null (not undefined) so we don't show loader
      // Only set if we haven't already fetched (to avoid overwriting a valid userId)
      if (authenticatedUserId === undefined) {
        setAuthenticatedUserId(null)
      }
      hasFetchedUserId.current = false
    }
  }, [IS_DEV, isAuthenticated, authLoading, authUserIdentity, getOrCreateUser, authenticatedUserId])

  // Development mode: use test user
  const testUser = useQuery(api.users.getByEmail, 
    IS_DEV ? { email: TEST_USER_EMAIL } : 'skip'
  )
  const createTestUser = useMutation(api.users.getOrCreateTestUser)
  const hasCreatedTestUser = useRef(false)

  // In development, ensure test user exists and is premium
  useEffect(() => {
    if (IS_DEV && testUser === null && !hasCreatedTestUser.current) {
      hasCreatedTestUser.current = true
      createTestUser().catch((error) => {
        console.error('Failed to create test user:', error)
        hasCreatedTestUser.current = false // Allow retry on error
      })
    }
  }, [IS_DEV, testUser, createTestUser])

  // In production, use authenticated user
  if (!IS_DEV) {
    // Return undefined while loading:
    // - Auth is loading
    // - We have an authUserIdentity but haven't created/fetched the user yet
    // - We're waiting for authUserIdentity query to resolve
    const isLoading = authLoading || 
      (authUserIdentity !== undefined && authUserIdentity !== null && authenticatedUserId === undefined) ||
      (authUserIdentity === undefined && !authLoading) // Still waiting for query
    const result = isLoading ? undefined : authenticatedUserId
    return result
  }

  // In development, use test user (with premium subscription)
  if (testUser) {
    return testUser._id
  }

  // Still loading or creating test user
  return undefined
}

/**
 * Get auth actions for sign in/out
 */
export { useAuthActions }
