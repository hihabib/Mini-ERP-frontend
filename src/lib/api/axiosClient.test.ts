import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as tokenStore from '@/lib/auth/tokenStore'
import * as authSlice from '@/store/slices/authSlice'
import { store } from '@/store/store'

import { ApiClientError } from './ApiClientError'
import axiosClient, { authAxios } from './axiosClient'

vi.mock('@/lib/auth/tokenStore', () => ({
  getToken: vi.fn().mockReturnValue(null),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}))

vi.mock('@/store/store', () => ({
  store: { dispatch: vi.fn() },
}))

let mock: MockAdapter
let authMock: MockAdapter

beforeEach(() => {
  mock = new MockAdapter(axiosClient)
  authMock = new MockAdapter(authAxios)
  vi.mocked(tokenStore.getToken).mockReturnValue(null)
  vi.mocked(store.dispatch).mockClear()
  vi.mocked(tokenStore.setToken).mockClear()
  vi.mocked(tokenStore.clearToken).mockClear()
})

afterEach(() => {
  mock.restore()
  authMock.restore()
})

// ─── Response interceptor ────────────────────────────────────────────────────

describe('response interceptor — envelope unwrapping', () => {
  it('unwraps data from ApiSuccessResponse envelope', async () => {
    mock.onGet('/products').reply(200, {
      success: true,
      message: 'OK',
      data: { id: 1, name: 'Widget' },
    })

    const res = await axiosClient.get('/products')
    expect(res.data).toEqual({ id: 1, name: 'Widget' })
  })

  it('lifts meta from envelope onto response object', async () => {
    mock.onGet('/products').reply(200, {
      success: true,
      message: 'OK',
      data: [],
      meta: { page: 1, limit: 20, total: 100 },
    })

    const res = await axiosClient.get('/products')
    expect(res.meta).toEqual({ page: 1, limit: 20, total: 100 })
  })

  it('passes through responses without a success flag unchanged', async () => {
    mock.onGet('/health').reply(200, { status: 'ok' })
    const res = await axiosClient.get('/health')
    expect(res.data).toEqual({ status: 'ok' })
  })
})

// ─── Error interceptor ────────────────────────────────────────────────────────

describe('error interceptor — ApiClientError shaping', () => {
  it('throws ApiClientError for shaped ApiErrorResponse', async () => {
    mock.onGet('/products').reply(422, {
      success: false,
      message: 'Validation failed',
      errors: { name: 'Required' },
    })

    await expect(axiosClient.get('/products')).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof ApiClientError &&
        e.message === 'Validation failed' &&
        e.errors?.name === 'Required',
    )
  })

  it('throws ApiClientError for 500 with no shaped body', async () => {
    mock.onGet('/products').reply(500)
    await expect(axiosClient.get('/products')).rejects.toBeInstanceOf(ApiClientError)
  })

  it('throws ApiClientError for network error', async () => {
    mock.onGet('/products').networkError()
    await expect(axiosClient.get('/products')).rejects.toBeInstanceOf(ApiClientError)
  })
})

// ─── Request interceptor ─────────────────────────────────────────────────────

describe('request interceptor — bearer token', () => {
  it('attaches Authorization header when a token is stored', async () => {
    vi.mocked(tokenStore.getToken).mockReturnValue('my-token')
    mock.onGet('/me').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer my-token')
      return [200, { success: true, message: 'OK', data: {} }]
    })
    await axiosClient.get('/me')
  })

  it('does not attach Authorization header when no token is stored', async () => {
    vi.mocked(tokenStore.getToken).mockReturnValue(null)
    mock.onGet('/me').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined()
      return [200, { success: true, message: 'OK', data: {} }]
    })
    await axiosClient.get('/me')
  })
})

// ─── 401 silent refresh ───────────────────────────────────────────────────────

describe('401 handling — silent refresh + retry', () => {
  it('refreshes token and retries the original request on 401', async () => {
    let callCount = 0
    mock.onGet('/products').reply(() => {
      callCount++
      if (callCount === 1) return [401, { success: false, message: 'Unauthorized' }]
      return [200, { success: true, message: 'OK', data: [{ id: 1 }] }]
    })

    authMock.onPost('/auth/refresh').reply(200, {
      success: true,
      message: 'OK',
      data: { accessToken: 'new-token' },
    })

    const res = await axiosClient.get('/products')
    expect(res.data).toEqual([{ id: 1 }])
    expect(tokenStore.setToken).toHaveBeenCalledWith('new-token')
    expect(callCount).toBe(2)
  })

  it('dispatches tokenCleared and throws when refresh fails', async () => {
    mock.onGet('/products').reply(401, { success: false, message: 'Unauthorized' })
    authMock.onPost('/auth/refresh').reply(401, { success: false, message: 'Session expired' })

    await expect(axiosClient.get('/products')).rejects.toBeInstanceOf(ApiClientError)
    expect(tokenStore.clearToken).toHaveBeenCalled()
    expect(store.dispatch).toHaveBeenCalledWith(authSlice.tokenCleared())
  })

  it('does not retry when the failing request is /auth/refresh itself', async () => {
    mock.onPost('/auth/refresh').reply(401, { success: false, message: 'Unauthorized' })
    await expect(axiosClient.post('/auth/refresh')).rejects.toBeInstanceOf(ApiClientError)
    expect(tokenStore.setToken).not.toHaveBeenCalled()
  })
})
