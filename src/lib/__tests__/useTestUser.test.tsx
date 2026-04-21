import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, beforeEach, it, vi } from 'vitest'
import { useLocalUserIdResolution } from '../useTestUser'

const {
  mockGetOrCreateUserFromEmail,
  mockMergeGuestIntoAuthedUser,
  mockUseMutation,
  mockUseConvexAuth,
  mockUseQuery,
} = vi.hoisted(() => {
  const getOrCreateUserFromEmail = vi.fn()
  const mergeGuestIntoAuthedUser = vi.fn()
  const useMutation = vi.fn()
  const useConvexAuth = vi.fn(() => ({
    isLoading: false,
    isAuthenticated: false,
  }))
  const useQuery = vi.fn()
  return {
    mockGetOrCreateUserFromEmail: getOrCreateUserFromEmail,
    mockMergeGuestIntoAuthedUser: mergeGuestIntoAuthedUser,
    mockUseMutation: useMutation,
    mockUseConvexAuth: useConvexAuth,
    mockUseQuery: useQuery,
  }
})

vi.mock('convex/react', () => ({
  useMutation: mockUseMutation,
  useConvexAuth: mockUseConvexAuth,
  useQuery: mockUseQuery,
}))

vi.mock('../../../convex/_generated/api', () => ({
  api: {
    users: {
      getOrCreateUserFromEmail: 'users.getOrCreateUserFromEmail',
      mergeGuestIntoAuthedUser: 'users.mergeGuestIntoAuthedUser',
      viewer: 'users.viewer',
    },
  },
}))

describe('useLocalUserIdResolution', () => {
  beforeEach(() => {
    localStorage.clear()
    mockGetOrCreateUserFromEmail.mockReset()
    mockMergeGuestIntoAuthedUser.mockReset()
    mockUseMutation.mockReset()
    mockUseConvexAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
    })
    mockUseQuery.mockImplementation((_ref, args) => {
      if (args === 'skip') return undefined
      return undefined
    })
    mockUseMutation.mockImplementation(() => {
      const i = mockUseMutation.mock.calls.length
      return i % 2 === 1 ? mockMergeGuestIntoAuthedUser : mockGetOrCreateUserFromEmail
    })
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
    expect(localStorage.getItem('marginalia_guest_convex_user_id')).toBe('user_anon_1')
  })

  it('uses existing guest identity when email and name are already stored', async () => {
    localStorage.setItem('marginalia_user_email', 'anon-persist@guest.marginalia')
    localStorage.setItem('marginalia_user_name', 'Guest User')
    mockGetOrCreateUserFromEmail.mockResolvedValue('user_guest_persist')

    const { result } = renderHook(() => useLocalUserIdResolution())

    await waitFor(() => {
      expect(result.current).toBe('user_guest_persist')
    })

    expect(mockGetOrCreateUserFromEmail).toHaveBeenCalledWith({
      email: 'anon-persist@guest.marginalia',
      name: 'Guest User',
    })
  })

  it('uses stored test email with derived fallback name when name is missing', async () => {
    localStorage.setItem('marginalia_user_email', 'test@example.com')
    mockGetOrCreateUserFromEmail.mockResolvedValue('user_test_derived')

    const { result } = renderHook(() => useLocalUserIdResolution())

    await waitFor(() => {
      expect(result.current).toBe('user_test_derived')
    })

    expect(mockGetOrCreateUserFromEmail).toHaveBeenCalledWith({
      email: 'test@example.com',
      name: 'test',
    })
    expect(localStorage.getItem('marginalia_user_name')).toBe('test')
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
