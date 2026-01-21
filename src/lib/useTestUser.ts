/**
 * Temporary hook to get test user ID for development
 * This will be replaced when auth is re-implemented
 * 
 * SECURITY: Only works in development mode to prevent unauthorized access in production
 */

import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

/**
 * Check if we're in development mode
 * Test user should only be available in development to prevent:
 * - Unauthorized AI access in production
 * - Unauthorized premium features in production
 * - Unexpected API costs from public usage
 */
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development'

/**
 * Hook to get or create the test user (test@example.com)
 * ONLY WORKS IN DEVELOPMENT MODE
 * 
 * In production, returns null immediately to prevent security issues
 * 
 * @returns user ID in dev, null in production, undefined while loading
 */
export function useTestUser(): Id<'users'> | null | undefined {
  const getOrCreateTestUser = useMutation(api.users.getOrCreateTestUser)
  const [userId, setUserId] = useState<Id<'users'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In production, immediately return null without making any API calls
    if (!isDevelopment) {
      setUserId(null)
      setIsLoading(false)
      return
    }

    let mounted = true

    const fetchUser = async () => {
      try {
        const id = await getOrCreateTestUser()
        if (mounted) {
          setUserId(id)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to get test user:', error)
        if (mounted) {
          setUserId(null)
          setIsLoading(false)
        }
      }
    }

    fetchUser()

    return () => {
      mounted = false
    }
  }, [getOrCreateTestUser])

  if (isLoading) {
    return undefined // Still loading
  }

  return userId
}
