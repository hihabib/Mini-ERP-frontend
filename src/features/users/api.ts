import axiosClient from '@/lib/api/axiosClient'

import type { User, Role, CreateUserPayload, UpdateUserPayload, UsersResponse } from './types'

export const getUsers = async (params?: {
  page?: number
  limit?: number
  search?: string
}): Promise<UsersResponse> => {
  const response = await axiosClient.get<User[]>('/users', { params })
  return {
    data: response.data,
    meta: {
      page: response.meta?.page ?? 1,
      limit: response.meta?.limit ?? 10,
      total: response.meta?.total ?? 0,
    },
  }
}

export const getUser = async (id: string): Promise<User> => {
  const { data } = await axiosClient.get<User>(`/users/${id}`)
  return data
}

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const { data } = await axiosClient.post<{ data: User }>('/users', payload)
  return data.data
}

export const updateUser = async (id: string, payload: UpdateUserPayload): Promise<User> => {
  const { data } = await axiosClient.patch<{ data: User }>(`/users/${id}`, payload)
  return data.data
}

export const getRoles = async (): Promise<Role[]> => {
  const { data } = await axiosClient.get<Role[]>('/roles')
  return data
}
