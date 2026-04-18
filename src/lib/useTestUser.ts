/**
 * Hook to get or create a persistent local user identity without auth.
 */

import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

const USER_EMAIL_KEY = 'marginalia_user_email'
const USER_NAME_KEY = 'marginalia_user_name'
const ANON_ID_KEY = 'marginalia_anon_id'
const USER_ID_KEY = 'marginalia_user_id'

const DEFAULT_GUEST_NAME = 'Guest User'

function generateAnonId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getOrCreateLocalIdentity() {
  const storedEmail = localStorage.getItem(USER_EMAIL_KEY)
  const storedName = localStorage.getItem(USER_NAME_KEY)

  if (storedEmail) {
    const name = storedName || DEFAULT_GUEST_NAME
    if (!storedName) {
      localStorage.setItem(USER_NAME_KEY, name)
    }
    return { email: storedEmail, name }
  }

  const existingAnonId = localStorage.getItem(ANON_ID_KEY)
  const anonId = existingAnonId || generateAnonId()
  if (!existingAnonId) {
    localStorage.setItem(ANON_ID_KEY, anonId)
  }

  const email = `anon-${anonId}@guest.marginalia`
  const name = DEFAULT_GUEST_NAME
  localStorage.setItem(USER_EMAIL_KEY, email)
  localStorage.setItem(USER_NAME_KEY, name)

  return { email, name }
}

/**
 * @returns user ID when available, null on failure, undefined while loading
 */
export function useTestUser(): Id<'users'> | null | undefined {
  const getOrCreateUserFromEmail = useMutation(api.users.getOrCreateUserFromEmail)
  const [userId, setUserId] = useState<Id<'users'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchUser = async () => {
      try {
        const identity = getOrCreateLocalIdentity()
        const id = await getOrCreateUserFromEmail(identity)
        if (mounted) {
          setUserId(id)
          localStorage.setItem(USER_ID_KEY, id)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to get local user:', error)
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
  }, [getOrCreateUserFromEmail])

  if (isLoading) {
    return undefined // Still loading
  }

  return userId
}
