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
const GUEST_EMAIL_DOMAIN = 'guest.marginalia'

const DEFAULT_GUEST_NAME = 'Guest User'
const MAX_EMAIL_LENGTH = 254
const MAX_NAME_LENGTH = 100
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value: string) {
  return value.length > 0 && value.length <= MAX_EMAIL_LENGTH && BASIC_EMAIL_PATTERN.test(value)
}

function normalizeName(value: string | null) {
  if (!value) return DEFAULT_GUEST_NAME
  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_GUEST_NAME
  return trimmed.slice(0, MAX_NAME_LENGTH)
}

function generateAnonId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  throw new Error('Unable to generate secure anonymous identity')
}

function getOrCreateLocalIdentity() {
  const storedEmail = localStorage.getItem(USER_EMAIL_KEY)
  const storedName = normalizeName(localStorage.getItem(USER_NAME_KEY))

  if (storedEmail && isValidEmail(storedEmail)) {
    localStorage.setItem(USER_NAME_KEY, storedName)
    return { email: storedEmail, name: storedName }
  }

  const existingAnonId = localStorage.getItem(ANON_ID_KEY)
  const anonId = existingAnonId || generateAnonId()
  if (!existingAnonId) {
    localStorage.setItem(ANON_ID_KEY, anonId)
  }

  const email = `anon-${anonId}@${GUEST_EMAIL_DOMAIN}`
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
