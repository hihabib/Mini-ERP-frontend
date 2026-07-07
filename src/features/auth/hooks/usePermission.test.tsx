import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAuth } from './useAuth'
import { usePermission } from './usePermission'

import type { User } from '@/types/user.types'

vi.mock('./useAuth', () => ({ useAuth: vi.fn() }))

const mockUseAuth = vi.mocked(useAuth)

const stubUser = (permissionKeys: string[]): User => ({
  _id: '1',
  name: 'Test',
  email: 'test@example.com',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  role: {
    _id: 'r1',
    name: 'Role',
    isSystemRole: false,
    permissions: permissionKeys.map((key, i) => ({
      _id: `p${i}`,
      key,
      description: '',
      module: '',
    })),
  },
})

describe('usePermission', () => {
  it('returns true when no permissionKey is required', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, isLoading: false })
    const { result } = renderHook(() => usePermission(undefined))
    expect(result.current).toBe(true)
  })

  it('returns false when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, isLoading: false })
    const { result } = renderHook(() => usePermission('product:create'))
    expect(result.current).toBe(false)
  })

  it('returns true when user has the required permission', () => {
    mockUseAuth.mockReturnValue({
      user: stubUser(['product:read', 'product:create']),
      isAuthenticated: true,
      isLoading: false,
    })
    const { result } = renderHook(() => usePermission('product:create'))
    expect(result.current).toBe(true)
  })

  it('returns false when user lacks the required permission', () => {
    mockUseAuth.mockReturnValue({
      user: stubUser(['product:read']),
      isAuthenticated: true,
      isLoading: false,
    })
    const { result } = renderHook(() => usePermission('product:create'))
    expect(result.current).toBe(false)
  })
})
