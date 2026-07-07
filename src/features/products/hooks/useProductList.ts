import { useQuery } from '@tanstack/react-query'

import { listProducts } from '../api'

import type { ProductListParams } from '../api'

export function useProductList(params: ProductListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => listProducts(params),
  })
}
