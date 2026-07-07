import { describe, expect, it } from 'vitest'

import { ApiClientError } from './ApiClientError'

describe('ApiClientError', () => {
  it('sets message correctly', () => {
    const err = new ApiClientError('Something went wrong')
    expect(err.message).toBe('Something went wrong')
  })

  it('sets name to ApiClientError', () => {
    const err = new ApiClientError('oops')
    expect(err.name).toBe('ApiClientError')
  })

  it('is instanceof Error', () => {
    const err = new ApiClientError('oops')
    expect(err instanceof Error).toBe(true)
  })

  it('is instanceof ApiClientError', () => {
    const err = new ApiClientError('oops')
    expect(err instanceof ApiClientError).toBe(true)
  })

  it('stores field errors when provided', () => {
    const errors = { email: 'Invalid email', password: 'Too short' }
    const err = new ApiClientError('Validation failed', errors)
    expect(err.errors).toEqual(errors)
  })

  it('leaves errors undefined when not provided', () => {
    const err = new ApiClientError('oops')
    expect(err.errors).toBeUndefined()
  })
})
