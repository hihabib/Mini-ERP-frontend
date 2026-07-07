# Frontend Feature Test Template

Every new feature's test file (`src/features/<feature>/<feature>.test.tsx`) should follow the structure below. Copy and adapt it — remove sections that don't apply, add sub-describes where needed, never remove a section just because it's inconvenient.

## Canonical shape

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock the socket singleton if the feature uses real-time hooks
vi.mock('@/lib/socket/socketClient', () => ({
  getSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
  })),
}))

// Mock env so tests don't need a real .env file
vi.mock('@/config/env', () => ({
  env: { apiBaseUrl: 'http://localhost:8000/api', socketUrl: 'http://localhost:8000' },
}))

// Mock permission hook if the component gates UI by role
vi.mock('@/features/auth/hooks/usePermission', () => ({
  usePermission: vi.fn(),
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

const stubEntity = (overrides = {}): MyEntity => ({
  _id: 'e1',
  name: 'Test Entity',
  ...overrides,
})

// ─── Rendering ───────────────────────────────────────────────────────────────

describe('<FeatureComponent>', () => {
  describe('rendering', () => {
    it('renders the expected content for an authorized user', () => {
      render(<FeatureComponent />, { wrapper })
      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })

    it('hides permission-gated actions for a user without the required permission', () => {
      vi.mocked(usePermission).mockReturnValue(false)
      render(<FeatureComponent />, { wrapper })
      expect(screen.queryByRole('button', { name: /restricted action/i })).not.toBeInTheDocument()
    })

    it('shows permission-gated actions for a user with the required permission', () => {
      vi.mocked(usePermission).mockReturnValue(true)
      render(<FeatureComponent />, { wrapper })
      expect(screen.getByRole('button', { name: /restricted action/i })).toBeInTheDocument()
    })
  })

  // ─── Interaction ───────────────────────────────────────────────────────────

  describe('interaction', () => {
    it('handles the primary user action correctly', async () => {
      const user = userEvent.setup()
      render(<FeatureComponent />, { wrapper })
      await user.click(screen.getByRole('button', { name: /submit/i }))
      await waitFor(() => expect(screen.getByText(/success/i)).toBeInTheDocument())
    })

    it('shows validation errors for invalid input', async () => {
      const user = userEvent.setup()
      render(<FeatureComponent />, { wrapper })
      await user.click(screen.getByRole('button', { name: /submit/i }))
      await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/required/i))
    })
  })

  // ─── API integration (mocked) ──────────────────────────────────────────────

  describe('API integration (mocked)', () => {
    it('shows success feedback after a successful mutation', async () => {
      // Arrange: mock the mutation hook or API module
      const user = userEvent.setup()
      render(<FeatureComponent />, { wrapper })

      // Act
      await user.click(screen.getByRole('button', { name: /submit/i }))

      // Assert
      await waitFor(() => expect(screen.getByText(/saved/i)).toBeInTheDocument())
    })

    it('shows an error message when the mutation fails', async () => {
      // Mock the API to reject
      const user = userEvent.setup()
      render(<FeatureComponent />, { wrapper })

      await user.click(screen.getByRole('button', { name: /submit/i }))

      await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument())
    })
  })

  // ─── Real-time behavior ────────────────────────────────────────────────────
  // Include this section only if the feature reacts to socket events.

  describe('real-time behavior', () => {
    let socketHandler: ((data: unknown) => void) | undefined

    beforeEach(() => {
      vi.mocked(getSocket).mockReturnValue({
        on: vi.fn((event, handler) => {
          if (event === 'relevant:event') socketHandler = handler
        }),
        off: vi.fn(),
      } as unknown as ReturnType<typeof getSocket>)
    })

    it('updates state when the relevant socket event fires', async () => {
      const queryClient = makeClient()
      const spy = vi.spyOn(queryClient, 'invalidateQueries')

      function Harness() {
        useFeatureHook()
        return null
      }

      render(
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>,
      )

      await waitFor(() => expect(socketHandler).toBeDefined())

      act(() => {
        socketHandler!({/* event payload */})
      })

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['feature', 'key'] }))
    })
  })
})
```

## Rules

### What must always be present

| Requirement                                     | Reason                                                                                                    |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Permission-hidden test (negative)               | Proves the gated UI is absent for unauthorized roles, not just present for authorized ones                |
| Permission-shown test (positive)                | Baseline rendering confirmation                                                                           |
| Error-path test for every mutation              | Prevents "green tests, broken UX" when the API rejects                                                    |
| Socket-driven state change test (if applicable) | Confirms the event changes actual application state (cache or UI), not just that a handler was registered |

### What does NOT need a unit test

- **Page-level compositions** (thin route wrappers like `ProductListPage`) — covered by E2E
- **Pure type files** (`src/types/**`) — no executable code
- **Shadcn UI primitives** (`src/components/ui/**`) — third-party, excluded from coverage
- **Route config** (`src/routes/router.tsx`) — declarative, covered by E2E

### Coverage minimums (enforced by CI)

```
Statements : 70%
Branches   : 65%
Functions  : 70%
Lines      : 70%
```

Run `pnpm test:coverage` locally before pushing. CI fails on unmet thresholds.

### Test file location

```
src/features/<feature>/<feature>.test.tsx   # component + hook tests
src/features/<feature>/hooks/<hooks>.test.ts  # hook-only tests (when needed to avoid mock conflicts)
tests/e2e/<feature>.spec.ts                 # Playwright E2E
```
