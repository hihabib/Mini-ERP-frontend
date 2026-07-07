export interface Role {
  _id: string
  name: string
  permissions?: string[]
  isSystemRole?: boolean
}

export interface User {
  _id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password?: string
  role: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
  role?: string
  isActive?: boolean
}

export interface UsersResponse {
  data: User[]
  meta: {
    page: number
    limit: number
    total: number
  }
}

export interface RolesResponse {
  data: Role[]
}
