import axiosClient from '@/lib/api/axiosClient'
import { buildQueryParams } from '@/lib/api/buildQueryParams'

import type { Product } from '@/types/product.types'

export interface ProductListParams {
  search?: string
  category?: string
  sort?: string
  page?: number
  limit?: number
}

export interface ProductListResult {
  products: Product[]
  meta: { page: number; limit: number; total: number }
}

export async function listProducts(params: ProductListParams): Promise<ProductListResult> {
  const res = await axiosClient.get<Product[]>('/products', {
    params: buildQueryParams(params as Record<string, unknown>),
  })
  return {
    products: res.data,
    meta: res.meta
      ? { page: res.meta.page ?? 1, limit: res.meta.limit ?? 10, total: res.meta.total ?? 0 }
      : { page: 1, limit: 10, total: 0 },
  }
}

export async function getProduct(id: string): Promise<Product> {
  const res = await axiosClient.get<Product>(`/products/${id}`)
  return res.data
}

export async function createProduct(data: FormData): Promise<Product> {
  const res = await axiosClient.post<Product>('/products', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function updateProduct(id: string, data: FormData): Promise<Product> {
  const res = await axiosClient.patch<Product>(`/products/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function deleteProduct(id: string): Promise<void> {
  await axiosClient.delete(`/products/${id}`)
}
