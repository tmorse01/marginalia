import { useMutation, useQuery, useAction, useConvexAuth } from 'convex/react'
import { useEffect, useRef, useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'

const TEST_USER_EMAIL = 'test@example.com'
const IS_DEV = import.meta.env.DEV

/**
 * Get the current authenticated user ID
 * In development mode, falls back to test user with premium subscription
 * In production, uses Convex Auth
 */
export function useCurrentUser(): Id<'users'> | undefined {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  
  // In production, get user ID from authenticated identity
  const authenticatedUserIdAction = useAction(api.auth.getCurrentUserId)
  const [authenticatedUserId, setAuthenticatedUserId] = useState<Id<'users'> | null | undefined>(undefined)
  const hasFetchedUserId = useRef(false)
  
  useEffect(() => {
    if (!IS_DEV && isAuthenticated && !hasFetchedUserId.current) {
      hasFetchedUserId.current = true
      authenticatedUserIdAction()
        .then((userId) => {
          setAuthenticatedUserId(userId)
          hasFetchedUserId.current = false // Allow refetch if identity changes
        })
        .catch(() => {
          setAuthenticatedUserId(null)
          hasFetchedUserId.current = false
        })
    } else if (!IS_DEV && !isAuthenticated && !authLoading) {
      setAuthenticatedUserId(null)
      hasFetchedUserId.current = false
    }
  }, [IS_DEV, isAuthenticated, authLoading, authenticatedUserIdAction])

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
    if (authLoading || authenticatedUserId === undefined) {
      return undefined // Still loading auth state
    }
    return authenticatedUserId ?? undefined
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
