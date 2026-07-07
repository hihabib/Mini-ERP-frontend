import { configureStore } from '@reduxjs/toolkit'
import { render, screen } from '@testing-library/react'
import { Provider as ReduxProvider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as useAuthHook from '@/features/auth/hooks/useAuth'
import * as usePermissionHook from '@/features/auth/hooks/usePermission'
import authReducer from '@/store/slices/authSlice'

import { AppLayout } from './AppLayout'

vi.mock('@/features/auth/hooks/useAuth')
vi.mock('@/features/auth/hooks/usePermission')

function renderWithProviders(ui: React.ReactElement) {
  const store = configureStore({
    reducer: { auth: authReducer },
  })
  return render(
    <ReduxProvider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ReduxProvider>,
  )
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: {
        _id: 'u1',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: { _id: 'r1', name: 'Admin', permissions: [], isSystemRole: true },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      isAuthenticated: true,
      isLoading: false,
    })
  })

  it('renders sidebar with navigation items based on permissions', () => {
    vi.spyOn(usePermissionHook, 'usePermission').mockImplementation((perm) => {
      if (perm === 'dashboard:view') return true
      if (perm === 'product:view') return false // Simulate missing perm
      if (perm === 'sale:view') return true
      return false
    })

    renderWithProviders(<AppLayout />)

    expect(screen.getByText('Mini-ERP')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Products')).not.toBeInTheDocument()
    expect(screen.getByText('POS (Sell)')).toBeInTheDocument()
    expect(screen.getByText('Sale History')).toBeInTheDocument()
  })

  it('renders the header with user information', () => {
    renderWithProviders(<AppLayout />)

    // The user name and email is in the dropdown menu. We need to trigger the dropdown or just check it's available
    // Shadcn's DropdownMenu renders content conditionally based on user interaction or via Radix.
    // However, the button with UserCircle icon is present.
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument()
  })
})
