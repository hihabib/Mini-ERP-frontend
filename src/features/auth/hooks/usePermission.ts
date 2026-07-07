import { useAuth } from './useAuth'

export function usePermission(permissionKey: string | undefined): boolean {
  const { user } = useAuth()
  if (!permissionKey) return true
  if (!user) return false
  return user.role.permissions.some((p) => p.key === permissionKey)
}
