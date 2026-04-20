/**
 * Local user identity (Convex) — resolved once at the app shell.
 */

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react'
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
const BASIC_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** After this, we stop waiting on Convex so the shell can render the error path. */
const USER_RESOLVE_TIMEOUT_MS = 20_000

function isValidEmail(value: string) {
  return value.length > 0 && value.length <= MAX_EMAIL_LENGTH && BASIC_EMAIL_PATTERN.test(value)
}

function normalizeName(value: string | null, fallback: string) {
  if (!value) return fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return trimmed.slice(0, MAX_NAME_LENGTH)
}

function getNameFallbackFromEmail(email: string) {
  const localPart = email.split('@')[0]?.trim()
  if (!localPart) return 'User'
  return localPart.slice(0, MAX_NAME_LENGTH)
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

  throw new Error(
    'Unable to generate secure anonymous identity: crypto API unavailable. Use a modern browser over HTTPS.'
  )
}

function getOrCreateLocalIdentity() {
  const storedEmail = localStorage.getItem(USER_EMAIL_KEY)

  if (storedEmail && isValidEmail(storedEmail)) {
    const storedName = localStorage.getItem(USER_NAME_KEY)
    const name = normalizeName(storedName, getNameFallbackFromEmail(storedEmail))
    localStorage.setItem(USER_NAME_KEY, name)
    return { email: storedEmail, name }
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

export type CurrentUserContextValue =
  | { status: 'loading' }
  | { status: 'ready'; userId: Id<'users'> | null }

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null)

/**
 * Resolves local user id once. Used by {@link CurrentUserProvider} and unit tests.
 * @returns undefined while loading, null on failure, user id when ready
 */
export function useLocalUserIdResolution(): Id<'users'> | null | undefined {
  const getOrCreateUserFromEmail = useMutation(api.users.getOrCreateUserFromEmail)
  const [userId, setUserId] = useState<Id<'users'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchUser = async () => {
      const convexUrl = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.trim()
      if (!convexUrl) {
        console.error(
          'useLocalUserIdResolution: VITE_CONVEX_URL is not set. Set it to your Convex .cloud URL and restart the dev server.'
        )
        if (mounted) {
          setUserId(null)
          setIsLoading(false)
        }
        return
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined
      try {
        const identity = getOrCreateLocalIdentity()
        const id = await Promise.race([
          getOrCreateUserFromEmail(identity),
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error(`Timed out after ${USER_RESOLVE_TIMEOUT_MS}ms waiting for Convex`)),
              USER_RESOLVE_TIMEOUT_MS
            )
          }),
        ])
        if (timeoutId !== undefined) clearTimeout(timeoutId)
        if (mounted) {
          setUserId(id)
          setIsLoading(false)
        }
      } catch (error) {
        if (timeoutId !== undefined) clearTimeout(timeoutId)
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
    return undefined
  }

  return userId
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const userIdOrPending = useLocalUserIdResolution()
  const value: CurrentUserContextValue =
    userIdOrPending === undefined ? { status: 'loading' } : { status: 'ready', userId: userIdOrPending }

  return createElement(CurrentUserContext.Provider, { value }, children)
}

/** For {@link AppShellGate} in the root route (must sit inside {@link CurrentUserProvider}). */
export function useCurrentUserShellState(): CurrentUserContextValue {
  const ctx = useContext(CurrentUserContext)
  if (!ctx) {
    throw new Error('useCurrentUserShellState must be used within CurrentUserProvider')
  }
  return ctx
}

/**
 * Resolved user id for the authenticated app shell. Do not call until the shell has mounted
 * (i.e. not while {@link useCurrentUserShellState} is loading).
 */
export function useTestUser(): Id<'users'> | null {
  const ctx = useContext(CurrentUserContext)
  if (!ctx) {
    throw new Error('useTestUser must be used within CurrentUserProvider')
  }
  if (ctx.status === 'loading') {
    throw new Error(
      'useTestUser was called while the user is still loading. This component should render only inside AppLayout after bootstrap.'
    )
  }
  return ctx.userId
}
