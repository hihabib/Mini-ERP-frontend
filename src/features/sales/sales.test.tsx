import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useProductList } from '@/features/products/hooks/useProductList'
import { useStockUpdates } from '@/features/products/hooks/useStockUpdates'

import { ProductSelector } from './components/ProductSelector'
import { SaleHistoryTable } from './components/SaleHistoryTable'
import { SaleLineItem } from './components/SaleLineItem'
import CreateSalePage from './pages/CreateSalePage'

import type { Product } from '@/types/product.types'
import type { Sale, SoldBy } from '@/types/sale.types'

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

// ─── SaleLineItem: quantity input branches ────────────────────────────────────

describe('SaleLineItem — quantity input', () => {
  it('clamps quantity to available stock when typed value exceeds it', () => {
    const product = stubProduct({ stockQuantity: 5 })
    const onQuantityChange = vi.fn()
    render(
      <SaleLineItem
        product={product}
        quantity={1}
        onQuantityChange={onQuantityChange}
        onRemove={vi.fn()}
      />,
      { wrapper },
    )

    fireEvent.change(screen.getByRole('spinbutton', { name: /quantity for widget a/i }), {
      target: { value: '10' },
    })

    expect(onQuantityChange).toHaveBeenCalledWith(5)
  })

  it('ignores non-numeric input without calling onQuantityChange', () => {
    const product = stubProduct({ stockQuantity: 10 })
    const onQuantityChange = vi.fn()
    render(
      <SaleLineItem
        product={product}
        quantity={1}
        onQuantityChange={onQuantityChange}
        onRemove={vi.fn()}
      />,
      { wrapper },
    )

    fireEvent.change(screen.getByRole('spinbutton', { name: /quantity for widget a/i }), {
      target: { value: 'abc' },
    })

    expect(onQuantityChange).not.toHaveBeenCalled()
  })

  it('shows "Only N left" warning when stock is between 1 and 4', () => {
    const product = stubProduct({ stockQuantity: 3 })
    render(
      <SaleLineItem product={product} quantity={1} onQuantityChange={vi.fn()} onRemove={vi.fn()} />,
      { wrapper },
    )

    expect(screen.getByText(/only 3 left/i)).toBeInTheDocument()
  })

  it('shows "Out of stock" when stockQuantity is 0', () => {
    const product = stubProduct({ stockQuantity: 0 })
    render(
      <SaleLineItem product={product} quantity={1} onQuantityChange={vi.fn()} onRemove={vi.fn()} />,
      { wrapper },
    )

    expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
  })
})

// ─── SaleHistoryTable ─────────────────────────────────────────────────────────

const stubSale = (overrides: Partial<Sale> = {}): Sale => ({
  _id: 's1',
  items: [
    {
      product: 'p1',
      productNameSnapshot: 'Widget A',
      quantity: 2,
      unitPriceSnapshot: 10,
      subtotal: 20,
    },
  ],
  grandTotal: 20,
  soldBy: { _id: 'u1', name: 'Admin User', email: 'admin@test.dev' } satisfies SoldBy,
  createdAt: '2024-01-15T10:30:00.000Z',
  ...overrides,
})

describe('SaleHistoryTable', () => {
  it('shows empty state when there are no sales', () => {
    render(<SaleHistoryTable sales={[]} />, { wrapper })
    expect(screen.getByText(/no sales recorded yet/i)).toBeInTheDocument()
  })

  it('renders a sale row with grand total and seller name when soldBy is an object', () => {
    render(<SaleHistoryTable sales={[stubSale()]} />, { wrapper })
    expect(screen.getByText('$20.00')).toBeInTheDocument()
    expect(screen.getByText('Admin User')).toBeInTheDocument()
  })

  it('renders seller as a plain string when soldBy is not an object', () => {
    render(<SaleHistoryTable sales={[stubSale({ soldBy: 'u-raw-id' })]} />, { wrapper })
    expect(screen.getByText('u-raw-id')).toBeInTheDocument()
  })
})
