import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, beforeEach, it, vi } from 'vitest'
import { useLocalUserIdResolution } from '../useTestUser'

const { mockGetOrCreateUserFromEmail, mockUseMutation } = vi.hoisted(() => {
  const getOrCreateUserFromEmail = vi.fn()
  const useMutation = vi.fn(() => getOrCreateUserFromEmail)
  return {
    mockGetOrCreateUserFromEmail: getOrCreateUserFromEmail,
    mockUseMutation: useMutation,
  }
})

vi.mock('convex/react', () => ({
  useMutation: mockUseMutation,
}))

vi.mock('../../../convex/_generated/api', () => ({
  api: {
    users: {
      getOrCreateUserFromEmail: 'users.getOrCreateUserFromEmail',
    },
  },
}))

describe('useLocalUserIdResolution', () => {
  beforeEach(() => {
    localStorage.clear()
    mockGetOrCreateUserFromEmail.mockReset()
    mockUseMutation.mockClear()
    vi.stubEnv('VITE_CONVEX_URL', 'https://test.convex.cloud')
  })

  it('creates and stores an anonymous identity when no account exists', async () => {
    mockGetOrCreateUserFromEmail.mockResolvedValue('user_anon_1')

    const { result } = renderHook(() => useLocalUserIdResolution())

    expect(result.current).toBe(undefined)

    await waitFor(() => {
      expect(result.current).toBe('user_anon_1')
    })

    expect(mockGetOrCreateUserFromEmail).toHaveBeenCalledTimes(1)
    expect(mockGetOrCreateUserFromEmail).toHaveBeenCalledWith({
      email: expect.stringMatching(/^anon-.*@guest\.marginalia$/),
      name: 'Guest User',
    })

    expect(localStorage.getItem('marginalia_user_email')).toMatch(/^anon-.*@guest\.marginalia$/)
    expect(localStorage.getItem('marginalia_user_name')).toBe('Guest User')
    expect(localStorage.getItem('marginalia_anon_id')).toBeTruthy()
  })

  it('uses existing account identity when email and name are already stored', async () => {
    localStorage.setItem('marginalia_user_email', 'account@example.com')
    localStorage.setItem('marginalia_user_name', 'Account User')
    mockGetOrCreateUserFromEmail.mockResolvedValue('user_account_1')

    const { result } = renderHook(() => useLocalUserIdResolution())

    await waitFor(() => {
      expect(result.current).toBe('user_account_1')
    })

    expect(mockGetOrCreateUserFromEmail).toHaveBeenCalledWith({
      email: 'account@example.com',
      name: 'Account User',
    })
  })

  it('uses stored account email with derived fallback name when name is missing', async () => {
    localStorage.setItem('marginalia_user_email', 'owner@example.com')
    mockGetOrCreateUserFromEmail.mockResolvedValue('user_account_derived_name')

    const { result } = renderHook(() => useLocalUserIdResolution())

    await waitFor(() => {
      expect(result.current).toBe('user_account_derived_name')
    })

    expect(mockGetOrCreateUserFromEmail).toHaveBeenCalledWith({
      email: 'owner@example.com',
      name: 'owner',
    })
    expect(localStorage.getItem('marginalia_user_name')).toBe('owner')
  })

  it('falls back to null when user creation fails', async () => {
    mockGetOrCreateUserFromEmail.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useLocalUserIdResolution())

    await waitFor(() => {
      expect(result.current).toBe(null)
    })
  })

  it('resolves to null when VITE_CONVEX_URL is not set', async () => {
    vi.stubEnv('VITE_CONVEX_URL', '')

    const { result } = renderHook(() => useLocalUserIdResolution())

    await waitFor(() => {
      expect(result.current).toBe(null)
    })

    expect(mockGetOrCreateUserFromEmail).not.toHaveBeenCalled()
  })

  it('ignores invalid stored email and regenerates guest identity', async () => {
    localStorage.setItem('marginalia_user_email', 'not-an-email')
    localStorage.setItem('marginalia_user_name', 'Existing Name')
    mockGetOrCreateUserFromEmail.mockResolvedValue('user_regenerated_1')

    const { result } = renderHook(() => useLocalUserIdResolution())

    await waitFor(() => {
      expect(result.current).toBe('user_regenerated_1')
    })

    expect(mockGetOrCreateUserFromEmail).toHaveBeenCalledWith({
      email: expect.stringMatching(/^anon-.*@guest\.marginalia$/),
      name: 'Guest User',
    })
  })
})
