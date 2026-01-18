import { useMutation, useQuery } from 'convex/react'
import { useEffect, useRef } from 'react'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'

/**
 * Development helper to get or create a test user
 * TODO: Replace with proper authentication
 */
export function useCurrentUser(): Id<'users'> | undefined {
  // For development, we'll use a hardcoded test email
  // In production, this would come from Convex Auth
  const testEmail = 'test@example.com'
  const testName = 'Test User'
  const hasCreatedUser = useRef(false)

  const existingUser = useQuery(api.users.getByEmail, { email: testEmail })
  const createUser = useMutation(api.users.create)

  // Create user if it doesn't exist (only once)
  useEffect(() => {
    if (existingUser === null && !hasCreatedUser.current) {
      hasCreatedUser.current = true
      createUser({ name: testName, email: testEmail }).catch((error) => {
        console.error('Failed to create user:', error)
        hasCreatedUser.current = false // Allow retry on error
      })
    }
  }, [existingUser, createUser, testName, testEmail])

  // If user exists, return its ID
  if (existingUser) {
    return existingUser._id
  }

  // Still loading or creating
  return undefined
}

