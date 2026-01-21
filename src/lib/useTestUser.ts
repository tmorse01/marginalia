/**
 * Temporary hook to get test user ID for development
 * This will be replaced when auth is re-implemented
 */

import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

/**
 * Hook to get or create the test user (test@example.com)
 * Returns the user ID once it's available
 */
export function useTestUser(): Id<'users'> | null | undefined {
  const getOrCreateTestUser = useMutation(api.users.getOrCreateTestUser)
  const [userId, setUserId] = useState<Id<'users'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
