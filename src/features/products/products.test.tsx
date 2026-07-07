import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePermission } from '@/features/auth/hooks/usePermission'

import { DeleteProductDialog } from './components/DeleteProductDialog'
import { ProductForm } from './components/ProductForm'
import { ProductPagination } from './components/ProductPagination'
import { ProductSearchBar } from './components/ProductSearchBar'
import { ProductTable } from './components/ProductTable'

import type { Product } from '@/types/product.types'

vi.mock('@/features/auth/hooks/usePermission', () => ({ usePermission: vi.fn() }))
vi.mock('@/config/env', () => ({
  env: { apiBaseUrl: 'http://localhost:8000/api', socketUrl: 'http://localhost:8000' },
}))
vi.mock('./hooks/useDeleteProduct', () => ({
  useDeleteProduct: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

const mockUsePermission = vi.mocked(usePermission)

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

// ─── ProductTable permission tests ────────────────────────────────────────────

describe('ProductTable', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hides Edit and Delete buttons when user lacks product:update and product:delete', () => {
    mockUsePermission.mockImplementation((key) => key === undefined)
    render(<ProductTable products={[stubProduct()]} />, { wrapper })

    expect(screen.queryByRole('button', { name: /edit widget a/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete widget a/i })).not.toBeInTheDocument()
  })

  it('shows Edit button when user has product:update', () => {
    mockUsePermission.mockImplementation((key) => key === 'product:update')
    render(<ProductTable products={[stubProduct()]} />, { wrapper })

    expect(screen.getByRole('button', { name: /edit widget a/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete widget a/i })).not.toBeInTheDocument()
  })

  it('shows Delete button when user has product:delete', () => {
    mockUsePermission.mockImplementation((key) => key === 'product:delete')
    render(<ProductTable products={[stubProduct()]} />, { wrapper })

    expect(screen.queryByRole('button', { name: /edit widget a/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete widget a/i })).toBeInTheDocument()
  })

  it('shows low-stock badge when stockQuantity < 5', () => {
    mockUsePermission.mockReturnValue(false)
    render(<ProductTable products={[stubProduct({ stockQuantity: 3 })]} />, { wrapper })

    expect(screen.getByTestId('low-stock-badge')).toBeInTheDocument()
  })

  it('does not show low-stock badge when stockQuantity >= 5', () => {
    mockUsePermission.mockReturnValue(false)
    render(<ProductTable products={[stubProduct({ stockQuantity: 5 })]} />, { wrapper })

    expect(screen.queryByTestId('low-stock-badge')).not.toBeInTheDocument()
  })
})

// ─── ProductForm image required tests ─────────────────────────────────────────

describe('ProductForm (create)', () => {
  it('blocks submission and shows error when no image is selected', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(<ProductForm isCreate onSubmit={onSubmit} submitLabel="Create Product" />, { wrapper })

    await user.type(screen.getByLabelText(/name/i), 'Widget B')
    await user.type(screen.getByLabelText(/sku/i), 'WGT-002')
    await user.type(screen.getByLabelText(/category/i), 'Widgets')

    await user.click(screen.getByRole('button', { name: /create product/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/image is required/i)
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

// ─── ProductSearchBar debounce tests ──────────────────────────────────────────

describe('ProductSearchBar', () => {
  it('does not call onChange immediately on input change', () => {
    const onChange = vi.fn()
    render(<ProductSearchBar value="" onChange={onChange} debounceMs={200} />, { wrapper })

    // fireEvent is synchronous — no timer has elapsed yet
    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'wi' },
    })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('calls onChange after debounce period elapses', async () => {
    const onChange = vi.fn()
    render(<ProductSearchBar value="" onChange={onChange} debounceMs={50} />, { wrapper })

    fireEvent.change(screen.getByRole('textbox', { name: /search/i }), {
      target: { value: 'wid' },
    })

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('wid'), { timeout: 500 })
  })
})

// ─── ProductTable: empty state ────────────────────────────────────────────────

describe('ProductTable — empty state', () => {
  it('shows "No products found." when the product list is empty', () => {
    vi.mocked(usePermission).mockReturnValue(false)
    render(<ProductTable products={[]} />, { wrapper })
    expect(screen.getByText(/no products found/i)).toBeInTheDocument()
  })

  it('renders a placeholder div when the product has no image', () => {
    vi.mocked(usePermission).mockReturnValue(false)
    render(<ProductTable products={[stubProduct({ imageUrl: '' })]} />, { wrapper })
    // Expect no <img> element rendered for this product row
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})

// ─── ProductPagination ────────────────────────────────────────────────────────

describe('ProductPagination', () => {
  it('renders nothing when total items fit on a single page', () => {
    const { container } = render(
      <ProductPagination page={1} limit={10} total={8} onPageChange={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders page info when there are multiple pages', () => {
    render(<ProductPagination page={2} limit={10} total={25} onPageChange={vi.fn()} />)
    expect(screen.getByText(/11–20 of 25/)).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('calls onPageChange with decremented page when Previous is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<ProductPagination page={2} limit={10} total={25} onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: /previous page/i }))

    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('calls onPageChange with incremented page when Next is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(<ProductPagination page={1} limit={10} total={25} onPageChange={onPageChange} />)

    await user.click(screen.getByRole('button', { name: /next page/i }))

    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})

// ─── DeleteProductDialog ──────────────────────────────────────────────────────

describe('DeleteProductDialog', () => {
  it('does not render dialog content when product is null', () => {
    render(<DeleteProductDialog product={null} onClose={vi.fn()} />, { wrapper })
    expect(screen.queryByText(/delete product\?/i)).not.toBeInTheDocument()
  })

  it('shows the product name and action buttons when open', () => {
    render(<DeleteProductDialog product={stubProduct()} onClose={vi.fn()} />, { wrapper })
    expect(screen.getByText(/delete product\?/i)).toBeInTheDocument()
    expect(screen.getByText('Widget A')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
  })

  it('calls mutate with the product id when Delete is confirmed', async () => {
    const { useDeleteProduct } = await import('./hooks/useDeleteProduct')
    const mutate = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useDeleteProduct).mockReturnValue({ mutate, isPending: false } as any)

    const user = userEvent.setup()
    render(<DeleteProductDialog product={stubProduct()} onClose={vi.fn()} />, { wrapper })

    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    expect(mutate).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    )
  })
})
