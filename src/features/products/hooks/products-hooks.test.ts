import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useCreateProduct } from './useCreateProduct'
import { useDeleteProduct } from './useDeleteProduct'
import { useUpdateProduct } from './useUpdateProduct'

vi.mock('../api', () => ({
  createProduct: vi.fn().mockResolvedValue({ _id: 'new-p' }),
  updateProduct: vi.fn().mockResolvedValue({ _id: 'p1' }),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/config/env', () => ({
  env: { apiBaseUrl: 'http://localhost:8000/api', socketUrl: 'http://localhost:8000' },
}))

function makeClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function wrap(client: QueryClient, child: React.ReactNode) {
  return render(createElement(QueryClientProvider, { client }, child))
}

// ─── useCreateProduct ─────────────────────────────────────────────────────────

describe('useCreateProduct', () => {
  it('invalidates the products query list on successful creation', async () => {
    const queryClient = makeClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    function Harness() {
      const { mutate } = useCreateProduct()
      return createElement('button', { onClick: () => mutate(new FormData()) }, 'create')
    }

    const { getByText } = wrap(queryClient, createElement(Harness))
    getByText('create').click()

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['products'] })),
    )
  })
})

// ─── useDeleteProduct ─────────────────────────────────────────────────────────

describe('useDeleteProduct', () => {
  it('invalidates the products query list on successful deletion', async () => {
    const queryClient = makeClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    function Harness() {
      const { mutate } = useDeleteProduct()
      return createElement('button', { onClick: () => mutate('p1') }, 'delete')
    }

    const { getByText } = wrap(queryClient, createElement(Harness))
    getByText('delete').click()

    await waitFor(() =>
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['products'] })),
    )
  })
})

// ─── useUpdateProduct ─────────────────────────────────────────────────────────

describe('useUpdateProduct', () => {
  it('invalidates both the product list and the specific product query on success', async () => {
    const queryClient = makeClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    function Harness() {
      const { mutate } = useUpdateProduct()
      return createElement(
        'button',
        { onClick: () => mutate({ id: 'p1', data: new FormData() }) },
        'update',
      )
    }

    const { getByText } = wrap(queryClient, createElement(Harness))
    getByText('update').click()

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['products'] }))
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['product', 'p1'] }))
    })
  })
})
