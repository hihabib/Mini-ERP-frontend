import axiosClient from '@/lib/api/axiosClient'

export interface LowStockProduct {
  _id: string
  name: string
  sku: string
  stockQuantity: number
}

export interface DashboardStats {
  totalProducts: number
  totalSales: number
  totalRevenue: number
  lowStockProducts: LowStockProduct[]
  lowStockCount: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await axiosClient.get<DashboardStats>('/dashboard/stats')
  return res.data
}
