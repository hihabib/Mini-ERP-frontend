import axiosClient from '@/lib/api/axiosClient'

import type { LoginResponse, RefreshResponse } from './types'
import type { User } from '@/types/user.types'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await axiosClient.post<LoginResponse>('/auth/login', { email, password })
  return res.data
}

export async function logout(): Promise<void> {
  await axiosClient.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  const res = await axiosClient.get<User>('/auth/me')
  return res.data
}

export async function refresh(): Promise<RefreshResponse> {
  const res = await axiosClient.post<RefreshResponse>('/auth/refresh')
  return res.data
}
