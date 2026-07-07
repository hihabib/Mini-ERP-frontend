import { configureStore } from '@reduxjs/toolkit'
import { render, waitFor } from '@testing-library/react'
import { Provider as ReduxProvider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as tokenStore from '@/lib/auth/tokenStore'
import authReducer from '@/store/slices/authSlice'

import * as authApi from '../api'

import SessionInitializer from './SessionInitializer'

vi.mock('../api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('@/lib/auth/tokenStore', () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}))

const mockRefresh = vi.mocked(authApi.refresh)
const mockSetToken = vi.mocked(tokenStore.setToken)

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } })
}

describe('SessionInitializer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dispatches tokenAcquired and calls setToken on successful refresh', async () => {
    mockRefresh.mockResolvedValue({ accessToken: 'abc123' })
    const store = makeStore()

    render(
      <ReduxProvider store={store}>
        <SessionInitializer />
      </ReduxProvider>,
    )

    await waitFor(() => {
      expect(store.getState().auth.initialized).toBe(true)
    })
    expect(store.getState().auth.hasToken).toBe(true)
    expect(mockSetToken).toHaveBeenCalledWith('abc123')
  })

  it('dispatches tokenCleared when refresh fails', async () => {
    mockRefresh.mockRejectedValue(new Error('No cookie'))
    const store = makeStore()

    render(
      <ReduxProvider store={store}>
        <SessionInitializer />
      </ReduxProvider>,
    )

    await waitFor(() => {
      expect(store.getState().auth.initialized).toBe(true)
    })
    expect(store.getState().auth.hasToken).toBe(false)
    expect(mockSetToken).not.toHaveBeenCalled()
  })
})
