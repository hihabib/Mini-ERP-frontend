import { configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import authReducer from '@/store/slices/authSlice'

import ProtectedRoute from '../../routes/ProtectedRoute'

import * as authApi from './api'
import LoginForm from './components/LoginForm'
import { useAuth } from './hooks/useAuth'

vi.mock('./api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('./hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } })
}

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderLoginForm(initialPath = '/login') {
  return render(
    <ReduxProvider store={makeStore()}>
      <QueryClientProvider client={makeQueryClient()}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/" element={<div>Home</div>} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ReduxProvider>,
  )
}

function renderProtectedRoute({
  children = <div>Protected content</div>,
  requiredPermission,
}: {
  children?: React.ReactNode
  requiredPermission?: string
} = {}) {
  return render(
    <ReduxProvider store={makeStore()}>
      <QueryClientProvider client={makeQueryClient()}>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/login" element={<div>Login page</div>} />
            <Route
              path="/"
              element={
                <ProtectedRoute requiredPermission={requiredPermission}>{children}</ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ReduxProvider>,
  )
}

// ─── LoginForm ────────────────────────────────────────────────────────────────

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows validation errors when submitted with empty fields', async () => {
    renderLoginForm()
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('calls the login API with credentials and navigates home on success', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: 'test-token' })
    renderLoginForm()

    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('admin@example.com', 'password123')
    })
    expect(await screen.findByText('Home')).toBeInTheDocument()
  })

  it('shows an API error message on login failure', async () => {
    vi.mocked(authApi.login).mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    })
    renderLoginForm()

    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument()
  })
})

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading spinner while session is initializing', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, isLoading: true })
    renderProtectedRoute()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to /login', async () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, isLoading: false })
    renderProtectedRoute()
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })

  it('renders children for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: {
        _id: '1',
        name: 'Admin',
        email: 'admin@example.com',
        isActive: true,
        createdAt: '',
        updatedAt: '',
        role: { _id: 'r1', name: 'Admin', isSystemRole: true, permissions: [] },
      },
      isAuthenticated: true,
      isLoading: false,
    })
    renderProtectedRoute()
    expect(screen.getByText('Protected content')).toBeInTheDocument()
  })

  it('renders "Not authorized" when user lacks the required permission', () => {
    mockUseAuth.mockReturnValue({
      user: {
        _id: '1',
        name: 'Employee',
        email: 'emp@example.com',
        isActive: true,
        createdAt: '',
        updatedAt: '',
        role: {
          _id: 'r2',
          name: 'Employee',
          isSystemRole: false,
          permissions: [{ _id: 'p1', key: 'product:read', description: '', module: 'products' }],
        },
      },
      isAuthenticated: true,
      isLoading: false,
    })
    renderProtectedRoute({ requiredPermission: 'product:create' })
    expect(screen.getByRole('heading', { name: /not authorized/i })).toBeInTheDocument()
  })
})
