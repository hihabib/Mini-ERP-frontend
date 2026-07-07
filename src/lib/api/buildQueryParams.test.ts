import { describe, expect, it } from 'vitest'

import { buildQueryParams } from './buildQueryParams'

describe('buildQueryParams', () => {
  it('includes string values', () => {
    const params = buildQueryParams({ search: 'widget' })
    expect(params.get('search')).toBe('widget')
  })

  it('includes numeric values as strings', () => {
    const params = buildQueryParams({ page: 2, limit: 20 })
    expect(params.get('page')).toBe('2')
    expect(params.get('limit')).toBe('20')
  })

  it('omits undefined values', () => {
    const params = buildQueryParams({ page: 1, search: undefined })
    expect(params.has('search')).toBe(false)
    expect(params.get('page')).toBe('1')
  })

  it('omits null values', () => {
    const params = buildQueryParams({ status: null })
    expect(params.has('status')).toBe(false)
  })

  it('omits empty string values', () => {
    const params = buildQueryParams({ q: '' })
    expect(params.has('q')).toBe(false)
  })

  it('handles boolean false as a value', () => {
    const params = buildQueryParams({ active: false })
    expect(params.get('active')).toBe('false')
  })

  it('handles zero as a value', () => {
    const params = buildQueryParams({ offset: 0 })
    expect(params.get('offset')).toBe('0')
  })

  it('returns empty URLSearchParams for all-undefined input', () => {
    const params = buildQueryParams({ a: undefined, b: null, c: '' })
    expect(params.toString()).toBe('')
  })
})
