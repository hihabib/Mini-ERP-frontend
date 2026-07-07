/**
 * Builds URLSearchParams from a typed params object, omitting undefined/null/empty values.
 *
 * Shared list hook pattern:
 *   const [params, setParams] = useState<ProductListParams>({ page: 1, limit: 20 })
 *   const { data } = useQuery({
 *     queryKey: ['products', params],
 *     queryFn: () => getProducts(buildQueryParams(params)),
 *   })
 *
 * The queryKey includes `params` so React Query refetches automatically on filter/page change.
 */
export function buildQueryParams(params: Record<string, unknown>): URLSearchParams {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  return search
}
