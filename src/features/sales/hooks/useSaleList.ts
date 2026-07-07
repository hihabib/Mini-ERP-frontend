import { useQuery } from '@tanstack/react-query'

import { listSales } from '../api'

import type { SaleListParams } from '../api'

export function useSaleList(params: SaleListParams) {
  return useQuery({
    queryKey: ['sales', params],
    queryFn: () => listSales(params),
  })
}
