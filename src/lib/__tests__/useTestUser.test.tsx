import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, beforeEach, it, vi } from 'vitest'

const mockGetOrCreateUserFromEmail = vi.fn()
const mockUseMutation = vi.fn(() => mockGetOrCreateUserFromEmail)

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

import { useTestUser } from '../useTestUser'

describe('useTestUser', () => {
  beforeEach(() => {
    localStorage.clear()
    mockGetOrCreateUserFromEmail.mockReset()
    mockUseMutation.mockClear()
  })

  it('creates and stores an anonymous identity when no account exists', async () => {
    mockGetOrCreateUserFromEmail.mockResolvedValue('user_anon_1')

    const { result } = renderHook(() => useTestUser())

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
    expect(localStorage.getItem('marginalia_user_id')).toBe('user_anon_1')
  })

  it('uses existing account identity when email and name are already stored', async () => {
    localStorage.setItem('marginalia_user_email', 'account@example.com')
    localStorage.setItem('marginalia_user_name', 'Account User')
    mockGetOrCreateUserFromEmail.mockResolvedValue('user_account_1')

    const { result } = renderHook(() => useTestUser())

    await waitFor(() => {
      expect(result.current).toBe('user_account_1')
    })

    expect(mockGetOrCreateUserFromEmail).toHaveBeenCalledWith({
      email: 'account@example.com',
      name: 'Account User',
    })
  })

  it('falls back to null when user creation fails', async () => {
    mockGetOrCreateUserFromEmail.mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useTestUser())

    await waitFor(() => {
      expect(result.current).toBe(null)
    })
  })
})
