import axiosClient from '@/lib/api/axiosClient'
import { buildQueryParams } from '@/lib/api/buildQueryParams'

import type { Sale } from '@/types/sale.types'

export interface CreateSaleInput {
  items: { product: string; quantity: number }[]
}

export interface SaleListParams {
  page?: number
  limit?: number
}

export interface SaleListResult {
  sales: Sale[]
  meta: { page: number; limit: number; total: number }
}

export async function createSale(data: CreateSaleInput): Promise<Sale> {
  const res = await axiosClient.post<Sale>('/sales', data)
  return res.data
}

export async function listSales(params: SaleListParams): Promise<SaleListResult> {
  const res = await axiosClient.get<Sale[]>('/sales', {
    params: buildQueryParams(params as Record<string, unknown>),
  })
  return {
    sales: res.data,
    meta: res.meta
      ? { page: res.meta.page ?? 1, limit: res.meta.limit ?? 20, total: res.meta.total ?? 0 }
      : { page: 1, limit: 20, total: 0 },
  }
}

export async function getSale(id: string): Promise<Sale> {
  const res = await axiosClient.get<Sale>(`/sales/${id}`)
  return res.data
}
