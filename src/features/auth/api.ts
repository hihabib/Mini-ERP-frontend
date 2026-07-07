import axiosClient from '@/lib/api/axiosClient'

import type { LoginResponse, RefreshResponse } from './types'
import type { ApiSuccessResponse } from '@/types/api.types'
import type { User } from '@/types/user.types'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await axiosClient.post<ApiSuccessResponse<LoginResponse>>('/auth/login', {
    email,
    password,
  })
  return res.data.data
}

export async function logout(): Promise<void> {
  await axiosClient.post('/auth/logout')
}

export async function getMe(): Promise<User> {
  const res = await axiosClient.get<ApiSuccessResponse<User>>('/auth/me')
  return res.data.data
}

export async function refresh(): Promise<RefreshResponse> {
  const res = await axiosClient.post<ApiSuccessResponse<RefreshResponse>>('/auth/refresh')
  return res.data.data
}
