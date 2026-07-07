import { MutationCache, QueryClient, QueryClientProvider, useMutation } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiClientError } from './ApiClientError'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

function makeClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        if (error instanceof ApiClientError) {
          toast.error(error.message)
        }
      },
    }),
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function Trigger({ mutFn }: { mutFn: () => Promise<void> }) {
  const { mutate } = useMutation({ mutationFn: mutFn })
  return <button onClick={() => mutate()}>trigger</button>
}

describe('MutationCache global error handler', () => {
  let client: QueryClient

  beforeEach(() => {
    client = makeClient()
    vi.mocked(toast.error).mockClear()
  })

  it('calls toast.error with ApiClientError message', async () => {
    const error = new ApiClientError('Validation failed', { email: 'Invalid' })
    const mutFn = vi.fn().mockRejectedValue(error)

    render(
      <QueryClientProvider client={client}>
        <Trigger mutFn={mutFn} />
      </QueryClientProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'trigger' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Validation failed')
    })
  })

  it('does not call toast.error for plain Error', async () => {
    const mutFn = vi.fn().mockRejectedValue(new Error('Network error'))

    render(
      <QueryClientProvider client={client}>
        <Trigger mutFn={mutFn} />
      </QueryClientProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'trigger' }))

    await new Promise((r) => setTimeout(r, 50))
    expect(toast.error).not.toHaveBeenCalled()
  })
})
