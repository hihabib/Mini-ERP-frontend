import axios from 'axios'

import { env } from '@/config/env'
import { clearToken, getToken, setToken } from '@/lib/auth/tokenStore'
import { tokenCleared } from '@/store/slices/authSlice'
import { store } from '@/store/store'

// Extend Axios config to support the retry flag set by the 401 interceptor
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// A minimal client for the refresh call — avoids re-triggering the response interceptor
const authAxios = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

axiosClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // Never retry the refresh endpoint itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
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
      const res = await authAxios.post<{ data: { accessToken: string } }>('/auth/refresh')
      const newToken = res.data.data.accessToken
      setToken(newToken)
      processQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return axiosClient(originalRequest)
    } catch (err) {
      processQueue(err, null)
      clearToken()
      store.dispatch(tokenCleared())
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosClient
