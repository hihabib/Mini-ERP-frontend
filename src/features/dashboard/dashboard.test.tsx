import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LowStockList } from './components/LowStockList'
import { StatCard } from './components/StatCard'
import { StatsGrid } from './components/StatsGrid'
import { useDashboardInvalidation } from './hooks/useDashboardInvalidation'
import { useDashboardStats } from './hooks/useDashboardStats'
import DashboardPage from './pages/DashboardPage'

import type { DashboardStats } from './api'

// ─── Mocks ───────────────────────────────────────────────────────────────────

let saleCreatedHandler: (() => void) | undefined
let stockUpdatedHandler: (() => void) | undefined

vi.mock('@/lib/socket/socketClient', () => ({
  getSocket: vi.fn(() => ({
    on: vi.fn((event: string, handler: () => void) => {
      if (event === 'sale:created') saleCreatedHandler = handler
      if (event === 'stock:updated') stockUpdatedHandler = handler
    }),
    off: vi.fn(),
  })),
}))

vi.mock('@/config/env', () => ({
  env: { apiBaseUrl: 'http://localhost:8000/api', socketUrl: 'http://localhost:8000' },
}))

vi.mock('./hooks/useDashboardStats', () => ({
  useDashboardStats: vi.fn(),
}))

vi.mock('@/features/auth/hooks/usePermission', () => ({
  usePermission: vi.fn(() => true),
}))

vi.mock('@/features/sales/hooks/useSaleList', () => ({
  useSaleList: vi.fn(() => ({ data: { sales: [] }, isLoading: false, isError: false })),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

const stubStats = (overrides: Partial<DashboardStats> = {}): DashboardStats => ({
  totalProducts: 10,
  totalSales: 5,
  totalRevenue: 1500.5,
  lowStockProducts: [],
  lowStockCount: 0,
  ...overrides,
})

// ─── StatCard ─────────────────────────────────────────────────────────────────

describe('StatCard', () => {
  it('renders the label and value', () => {
    render(<StatCard label="Total Sales" value={42} testId="stat-total-sales" />)
    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getByTestId('stat-total-sales')).toHaveTextContent('42')
  })
})

// ─── StatsGrid ────────────────────────────────────────────────────────────────

describe('StatsGrid', () => {
  it('renders three stat cards with correct values from a mocked stats response', () => {
    const stats = stubStats({ totalProducts: 10, totalSales: 5, totalRevenue: 1500.5 })
    render(<StatsGrid stats={stats} />)
    expect(screen.getByTestId('stat-total-products')).toHaveTextContent('10')
    expect(screen.getByTestId('stat-total-sales')).toHaveTextContent('5')
    expect(screen.getByTestId('stat-total-revenue')).toHaveTextContent('$1500.50')
  })
})

// ─── LowStockList ─────────────────────────────────────────────────────────────

describe('LowStockList', () => {
  it('shows a warning badge for each low-stock item and displays the correct total count', () => {
    const stats = stubStats({
      lowStockProducts: [
        { _id: 'p1', name: 'Widget A', sku: 'WGT-001', stockQuantity: 2 },
        { _id: 'p2', name: 'Widget B', sku: 'WGT-002', stockQuantity: 4 },
      ],
      lowStockCount: 2,
    })
    render(<LowStockList stats={stats} />)
    expect(screen.getByTestId('low-stock-item-p1')).toBeInTheDocument()
    expect(screen.getByTestId('low-stock-item-p2')).toBeInTheDocument()
    expect(screen.getByTestId('low-stock-count-badge')).toHaveTextContent('2 Issues')
  })

  it('shows "…and N more" when lowStockCount exceeds the capped list length', () => {
    const stats = stubStats({
      lowStockProducts: [{ _id: 'p1', name: 'Widget A', sku: 'WGT-001', stockQuantity: 2 }],
      lowStockCount: 5,
    })
    render(<LowStockList stats={stats} />)
    expect(screen.getByText(/\+4 more products running low/)).toBeInTheDocument()
    expect(screen.getByTestId('low-stock-count-badge')).toHaveTextContent('5 Issues')
  })
})

// ─── useDashboardInvalidation ────────────────────────────────────────────────

describe('useDashboardInvalidation', () => {
  it('invalidates the dashboard stats query when sale:created fires', async () => {
    saleCreatedHandler = undefined
    const queryClient = makeClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    function Harness() {
      useDashboardInvalidation()
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(saleCreatedHandler).toBeDefined())

    act(() => {
      saleCreatedHandler!()
    })

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['dashboard', 'stats'] }))
  })

  it('invalidates the dashboard stats query when stock:updated fires', async () => {
    stockUpdatedHandler = undefined
    const queryClient = makeClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    function Harness() {
      useDashboardInvalidation()
      return null
    }

    render(
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(stockUpdatedHandler).toBeDefined())

    act(() => {
      stockUpdatedHandler!()
    })

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['dashboard', 'stats'] }))
  })
})

// ─── DashboardPage ────────────────────────────────────────────────────────────

describe('DashboardPage', () => {
  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={makeClient()}>{children}</QueryClientProvider>
  }

  it('renders the Dashboard heading', () => {
    vi.mocked(useDashboardStats).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    render(<DashboardPage />, { wrapper })
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
  })

  it('shows stat cards when data is loaded', () => {
    vi.mocked(useDashboardStats).mockReturnValue({
      data: stubStats(),
      isLoading: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    render(<DashboardPage />, { wrapper })
    expect(screen.getByTestId('stat-total-products')).toHaveTextContent('10')
    expect(screen.getByTestId('stat-total-sales')).toHaveTextContent('5')
  })

  it('shows error message when the request fails', () => {
    vi.mocked(useDashboardStats).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    render(<DashboardPage />, { wrapper })
    expect(screen.getByText(/failed to load dashboard stats/i)).toBeInTheDocument()
  })
})
