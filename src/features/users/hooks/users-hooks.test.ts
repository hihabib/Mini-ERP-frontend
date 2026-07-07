import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { toast } from 'sonner'
import { describe, expect, it, vi } from 'vitest'

import { createUser, updateUser } from '../api'

import { useCreateUser, useRoles, useUpdateUser, useUsers } from './users-hooks'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/config/env', () => ({
  env: { apiBaseUrl: 'http://localhost:8000/api', socketUrl: 'http://localhost:8000' },
}))

vi.mock('../api', () => ({
  createUser: vi.fn().mockResolvedValue({ _id: 'new-user', name: 'New User' }),
  updateUser: vi.fn().mockResolvedValue({ _id: 'user1', name: 'Updated User' }),
  getUsers: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 10, total: 0 } }),
  getRoles: vi.fn().mockResolvedValue([{ _id: 'role1', name: 'Admin' }]),
  getUser: vi.fn().mockResolvedValue({ _id: 'user1', name: 'Test User' }),
}))

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function wrap(client: QueryClient, child: React.ReactNode) {
  return render(createElement(QueryClientProvider, { client }, child))
}

// ─── useCreateUser ────────────────────────────────────────────────────────────

describe('useCreateUser', () => {
  it('invalidates the users list and shows success toast on creation', async () => {
    const queryClient = makeClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    function Harness() {
      const { mutate } = useCreateUser()
      return createElement(
        'button',
        {
          onClick: () =>
            mutate({ name: 'Test', email: 'test@test.com', password: 'pass123', role: 'role1' }),
        },
        'create',
      )
    }

    const { getByText } = wrap(queryClient, createElement(Harness))
    getByText('create').click()

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: expect.arrayContaining(['users', 'list']) }),
      )
      expect(toast.success).toHaveBeenCalledWith('User created successfully')
    })
  })

  it('shows an error toast when creation fails', async () => {
    vi.mocked(createUser).mockRejectedValueOnce({ response: { data: { message: 'Email taken' } } })
    const queryClient = makeClient()

    function Harness() {
      const { mutate } = useCreateUser()
      return createElement(
        'button',
        {
          onClick: () =>
            mutate({ name: 'Test', email: 'dup@test.com', password: 'pass123', role: 'role1' }),
        },
        'create',
      )
    }

    const { getByText } = wrap(queryClient, createElement(Harness))
    getByText('create').click()

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Email taken'))
  })
})

// ─── useUpdateUser ────────────────────────────────────────────────────────────

describe('useUpdateUser', () => {
  it('invalidates the user list and specific detail, shows success toast on update', async () => {
    const queryClient = makeClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    function Harness() {
      const { mutate } = useUpdateUser()
      return createElement(
        'button',
        { onClick: () => mutate({ id: 'user1', payload: { name: 'Updated' } }) },
        'update',
      )
    }

    const { getByText } = wrap(queryClient, createElement(Harness))
    getByText('update').click()

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: expect.arrayContaining(['users', 'list']) }),
      )
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: expect.arrayContaining(['users', 'detail', 'user1']) }),
      )
      expect(toast.success).toHaveBeenCalledWith('User updated successfully')
    })
  })

  it('shows an error toast when update fails', async () => {
    vi.mocked(updateUser).mockRejectedValueOnce({ response: { data: { message: 'Not found' } } })
    const queryClient = makeClient()

    function Harness() {
      const { mutate } = useUpdateUser()
      return createElement(
        'button',
        { onClick: () => mutate({ id: 'bad-id', payload: { name: 'X' } }) },
        'update',
      )
    }

    const { getByText } = wrap(queryClient, createElement(Harness))
    getByText('update').click()

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Not found'))
  })
})

// ─── useUsers ─────────────────────────────────────────────────────────────────

describe('useUsers', () => {
  it('fetches the paginated users list', async () => {
    const queryClient = makeClient()

    function Harness() {
      const { isSuccess } = useUsers({ page: 1, limit: 10 })
      return createElement('div', {}, isSuccess ? 'loaded' : 'loading')
    }

    const { findByText } = wrap(queryClient, createElement(Harness))
    await findByText('loaded')
  })
})

// ─── useRoles ─────────────────────────────────────────────────────────────────

describe('useRoles', () => {
  it('fetches the roles list', async () => {
    const queryClient = makeClient()

    function Harness() {
      const { data, isSuccess } = useRoles()
      return createElement('div', {}, isSuccess ? `roles:${data?.length}` : 'loading')
    }

    const { findByText } = wrap(queryClient, createElement(Harness))
    await findByText('roles:1')
  })
})
