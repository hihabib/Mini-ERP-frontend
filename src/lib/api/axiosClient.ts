import axios from 'axios'

import { env } from '@/config/env'
import { ApiClientError } from '@/lib/api/ApiClientError'
import { clearToken, getToken, setToken } from '@/lib/auth/tokenStore'
import { tokenCleared } from '@/store/slices/authSlice'
import { store } from '@/store/store'

import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/api.types'
import type { AxiosError } from 'axios'

// Augment AxiosResponse so paginated API functions can read `meta` from the
// unwrapped response without re-declaring it per feature.
declare module 'axios' {
  interface AxiosResponse {
    meta?: { page?: number; limit?: number; total?: number }
  }
  interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Separate client for the silent refresh call — no interceptors to avoid loops
const authAxios = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Response interceptor: unwrap envelope ────────────────────────────────────
// Transforms ApiSuccessResponse<T> → T and surfaces `meta` for paginated results.
// After this runs, res.data is the inner payload and res.meta carries pagination.
axiosClient.interceptors.response.use(
  (response) => {
    const shaped = response.data as ApiSuccessResponse<unknown>
    if (shaped && shaped.success === true) {
      response.meta = shaped.meta
      response.data = shaped.data
    }
    return response
  },
  // error handler below
)

// ─── Error interceptor: typed errors + 401 refresh ───────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  failedQueue = []
}

function toApiClientError(error: AxiosError): ApiClientError {
  const body = error.response?.data as ApiErrorResponse | undefined
  if (body && body.success === false) {
    return new ApiClientError(body.message, body.errors)
  }
  return new ApiClientError(error.message ?? 'An unexpected error occurred')
}

// Detach and reattach the error handler so it runs after the success handler
axiosClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const originalRequest = error.config

  // Always throw ApiClientError for non-401 errors
  if (error.response?.status !== 401 || !originalRequest) {
    throw toApiClientError(error)
  }

  // Don't retry the refresh endpoint itself
  if (originalRequest.url?.includes('/auth/refresh')) {
    throw toApiClientError(error)
  }

  if (originalRequest._retry) {
    throw toApiClientError(error)
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    }).then((token) => {
      originalRequest.headers.Authorization = `Bearer ${token}`
      return axiosClient(originalRequest)
    })
  }

  originalRequest._retry = true
  isRefreshing = true

  try {
    const res = await authAxios.post<ApiSuccessResponse<{ accessToken: string }>>('/auth/refresh')
    const newToken = res.data.data.accessToken
    setToken(newToken)
    processQueue(null, newToken)
    originalRequest.headers.Authorization = `Bearer ${newToken}`
    return axiosClient(originalRequest)
  } catch (err) {
    processQueue(err, null)
    clearToken()
    store.dispatch(tokenCleared())
    throw toApiClientError(err as AxiosError)
  } finally {
    isRefreshing = false
  }
})

// ─── Request interceptor: attach bearer token ─────────────────────────────────
axiosClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Exported for test mocking only — do not call directly in feature code
export { authAxios }

export default axiosClient
