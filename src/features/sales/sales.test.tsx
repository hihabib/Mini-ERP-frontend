import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useProductList } from '@/features/products/hooks/useProductList'
import { useStockUpdates } from '@/features/products/hooks/useStockUpdates'

import { ProductSelector } from './components/ProductSelector'
import { SaleLineItem } from './components/SaleLineItem'
import CreateSalePage from './pages/CreateSalePage'

import type { Product } from '@/types/product.types'

// ─── Mocks ───────────────────────────────────────────────────────────────────

let stockUpdatedHandler: ((data: unknown) => void) | undefined

vi.mock('@/lib/socket/socketClient', () => ({
  getSocket: vi.fn(() => ({
    on: vi.fn((event: string, handler: (data: unknown) => void) => {
      if (event === 'stock:updated') stockUpdatedHandler = handler
    }),
    off: vi.fn(),
  })),
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}))

vi.mock('@/features/products/hooks/useProductList', () => ({
  useProductList: vi.fn(),
}))

vi.mock('@/features/products/api', () => ({
  getProduct: vi.fn(),
}))

vi.mock('@/features/sales/hooks/useCreateSale', () => ({
  useCreateSale: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}))

vi.mock('@/config/env', () => ({
  env: { apiBaseUrl: 'http://localhost:8000/api', socketUrl: 'http://localhost:8000' },
}))

const mockUseProductList = vi.mocked(useProductList)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

const stubProduct = (overrides: Partial<Product> = {}): Product => ({
  _id: 'p1',
  name: 'Widget A',
  sku: 'WGT-001',
  category: 'Widgets',
  purchasePrice: 5,
  sellingPrice: 10,
  stockQuantity: 20,
  imageUrl: '/uploads/test.jpg',
  createdBy: 'u1',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides,
})

const stubMeta = { page: 1, limit: 8, total: 1 }

// ─── SaleLineItem: subtotal ───────────────────────────────────────────────────

describe('SaleLineItem', () => {
  it('displays the correct subtotal for given quantity and selling price', () => {
    const product = stubProduct({ sellingPrice: 12.5 })

    render(
      <SaleLineItem product={product} quantity={3} onQuantityChange={vi.fn()} onRemove={vi.fn()} />,
      { wrapper },
    )

    expect(screen.getByTestId('subtotal-p1')).toHaveTextContent('$37.50')
  })

  it('recalculates subtotal when quantity changes', () => {
    const product = stubProduct({ sellingPrice: 5 })
    const { rerender } = render(
      <SaleLineItem product={product} quantity={2} onQuantityChange={vi.fn()} onRemove={vi.fn()} />,
      { wrapper },
    )
    expect(screen.getByTestId('subtotal-p1')).toHaveTextContent('$10.00')

    rerender(
      <SaleLineItem product={product} quantity={5} onQuantityChange={vi.fn()} onRemove={vi.fn()} />,
    )
    expect(screen.getByTestId('subtotal-p1')).toHaveTextContent('$25.00')
  })
})

// ─── ProductSelector: duplicate prevention ────────────────────────────────────

describe('ProductSelector', () => {
  beforeEach(() => {
    mockUseProductList.mockReturnValue({
      data: { products: [stubProduct()], meta: stubMeta },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

  it('shows +qty indicator when product is already in sale', async () => {
    const user = userEvent.setup()

    render(<ProductSelector selectedProductIds={['p1']} onSelect={vi.fn()} />, { wrapper })

    await user.type(screen.getByLabelText(/search products/i), 'Widget')

    await waitFor(() => {
      expect(screen.getByText('+qty')).toBeInTheDocument()
    })
  })

  it('does not show +qty indicator when product is not yet in sale', async () => {
    const user = userEvent.setup()

    render(<ProductSelector selectedProductIds={[]} onSelect={vi.fn()} />, { wrapper })

    await user.type(screen.getByLabelText(/search products/i), 'Widget')

    await waitFor(() => {
      expect(screen.getByTestId('selector-product-p1')).toBeInTheDocument()
    })
    expect(screen.queryByText('+qty')).not.toBeInTheDocument()
  })
})

// ─── CreateSalePage: empty-items validation ───────────────────────────────────

describe('CreateSalePage — validation', () => {
  beforeEach(() => {
    mockUseProductList.mockReturnValue({
      data: { products: [], meta: stubMeta },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

  it('blocks submission and shows error when no items are added', async () => {
    const user = userEvent.setup()

    render(<CreateSalePage />, { wrapper })

    await user.click(screen.getByRole('button', { name: /complete sale/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/at least one product/i)
    })
  })
})

// ─── useStockUpdates: socket cache patch ─────────────────────────────────────

describe('useStockUpdates', () => {
  it('patches the product list cache when stock:updated fires', async () => {
    stockUpdatedHandler = undefined
    const queryClient = makeClient()
    const product = stubProduct({ stockQuantity: 20 })

    queryClient.setQueryData(['products', { page: 1, limit: 10 }], {
      products: [product],
      meta: stubMeta,
    })

    function Harness() {
      useStockUpdates()
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(stockUpdatedHandler).toBeDefined())

    act(() => {
      stockUpdatedHandler!({ productId: 'p1', stockQuantity: 7 })
    })

    const cached = queryClient.getQueryData<{ products: Product[] }>([
      'products',
      { page: 1, limit: 10 },
    ])
    expect(cached?.products[0].stockQuantity).toBe(7)
  })

  it('also patches the single product cache when stock:updated fires', async () => {
    stockUpdatedHandler = undefined
    const queryClient = makeClient()
    const product = stubProduct({ stockQuantity: 20 })

    queryClient.setQueryData(['product', 'p1'], product)

    function Harness() {
      useStockUpdates()
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(stockUpdatedHandler).toBeDefined())

    act(() => {
      stockUpdatedHandler!({ productId: 'p1', stockQuantity: 3 })
    })

    const cached = queryClient.getQueryData<Product>(['product', 'p1'])
    expect(cached?.stockQuantity).toBe(3)
  })
})

// ─── CreateSalePage: duplicate product increments quantity ───────────────────

describe('CreateSalePage — duplicate handling', () => {
  beforeEach(() => {
    mockUseProductList.mockReturnValue({
      data: { products: [stubProduct()], meta: stubMeta },
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  })

  it('increments quantity instead of adding duplicate row when same product is selected twice', async () => {
    const user = userEvent.setup()

    render(<CreateSalePage />, { wrapper })

    // Search and add
    await user.type(screen.getByLabelText(/search products/i), 'Widget')
    await waitFor(() => expect(screen.getByTestId('selector-product-p1')).toBeInTheDocument())
    await user.click(screen.getByTestId('selector-product-p1'))

    // Drop-down is still visible (search term unchanged) — click the same product again
    await waitFor(() => expect(screen.getByTestId('selector-product-p1')).toBeInTheDocument())
    await user.click(screen.getByTestId('selector-product-p1'))

    // Only one SaleLineItem should be rendered (one quantity input)
    const qtyInputs = screen.getAllByLabelText(/quantity for widget a/i)
    expect(qtyInputs).toHaveLength(1)
    expect(qtyInputs[0]).toHaveValue(2)
  })
})
