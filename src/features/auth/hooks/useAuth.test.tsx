import { configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { Provider as ReduxProvider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import authReducer from '@/store/slices/authSlice'

import * as authApi from '../api'

import { useAuth } from './useAuth'

import type { User } from '@/types/user.types'

vi.mock('../api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  refresh: vi.fn(),
}))

const mockGetMe = vi.mocked(authApi.getMe)

type AuthState = { hasToken: boolean; initialized: boolean }

function makeWrapper(authState: AuthState) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: authState },
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ReduxProvider store={store}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </ReduxProvider>
    )
  }
}

const stubUser: User = {
  _id: '1',
  name: 'Alice',
  email: 'alice@example.com',
  isActive: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  role: { _id: 'r1', name: 'Admin', isSystemRole: true, permissions: [] },
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('isLoading and not authenticated while store is not yet initialized', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper({ hasToken: false, initialized: false }),
    })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('not loading, not authenticated when initialized with no token', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper({ hasToken: false, initialized: true }),
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(mockGetMe).not.toHaveBeenCalled()
  })

  it('isLoading while getMe query is pending', () => {
    mockGetMe.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper({ hasToken: true, initialized: true }),
    })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('returns user and isAuthenticated true once getMe resolves', async () => {
    mockGetMe.mockResolvedValue(stubUser)
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper({ hasToken: true, initialized: true }),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(stubUser)
  })

  it('not authenticated if getMe rejects', async () => {
    mockGetMe.mockRejectedValue(new Error('Unauthorized'))
    const { result } = renderHook(() => useAuth(), {
      wrapper: makeWrapper({ hasToken: true, initialized: true }),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
