import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { usePermission } from '@/features/auth/hooks/usePermission'

import { UsersPage } from './pages/UsersPage'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@/config/env', () => ({
  env: { apiBaseUrl: 'http://test/api', socketUrl: 'http://test' },
}))

vi.mock('@/features/auth/hooks/usePermission', () => ({
  usePermission: vi.fn(),
}))

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Mock API and hooks
vi.mock('./hooks/users-hooks', () => ({
  useUsers: vi.fn(() => ({
    data: {
      data: [
        {
          _id: 'user1',
          name: 'Test User',
          email: 'test@test.com',
          role: { name: 'Admin', _id: 'role1' },
          isActive: true,
        },
      ],
      meta: { page: 1, limit: 10, total: 1 },
    },
    isLoading: false,
  })),
  useRoles: vi.fn(() => ({
    data: [{ _id: 'role1', name: 'Admin' }],
    isLoading: false,
  })),
  useCreateUser: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  })),
  useUpdateUser: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
  })),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('<UsersPage>', () => {
  describe('rendering and permissions', () => {
    it('renders the users list for an authorized user', () => {
      vi.mocked(usePermission).mockReturnValue(true) // has create & update permissions
      vi.mocked(useAuth).mockReturnValue({ user: { _id: 'user1' } } as any)

      render(<UsersPage />, { wrapper })

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('test@test.com')).toBeInTheDocument()
      expect(screen.getByText('(You)')).toBeInTheDocument()
    })

    it('hides Add User button for a user without user:create permission', () => {
      vi.mocked(usePermission).mockImplementation((perm) => perm !== 'user:create')
      vi.mocked(useAuth).mockReturnValue({ user: { _id: 'user1' } } as any)

      render(<UsersPage />, { wrapper })

      expect(screen.queryByRole('button', { name: /add user/i })).not.toBeInTheDocument()
    })

    it('hides edit buttons for a user without user:update permission', () => {
      vi.mocked(usePermission).mockImplementation((perm) => perm !== 'user:update')
      vi.mocked(useAuth).mockReturnValue({ user: { _id: 'user1' } } as any)

      render(<UsersPage />, { wrapper })

      expect(screen.queryByRole('button', { name: /edit user/i })).not.toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('opens create user dialog when Add User is clicked', async () => {
      vi.mocked(usePermission).mockReturnValue(true)
      const user = userEvent.setup()

      render(<UsersPage />, { wrapper })

      await user.click(screen.getByRole('button', { name: /add user/i }))
      await waitFor(() => expect(screen.getByText('Create User')).toBeInTheDocument())
    })

    it('opens edit user dialog when edit button is clicked', async () => {
      vi.mocked(usePermission).mockReturnValue(true)
      const user = userEvent.setup()

      render(<UsersPage />, { wrapper })

      await user.click(screen.getByRole('button', { name: /edit user/i }))
      await waitFor(() => expect(screen.getByText('Edit User')).toBeInTheDocument())
    })
  })
})
