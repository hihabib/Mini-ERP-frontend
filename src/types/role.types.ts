import type { Permission } from './permission.types'

export interface Role {
  _id: string
  name: string
  permissions: Permission[]
  isSystemRole: boolean
}
