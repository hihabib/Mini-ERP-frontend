import { ShoppingBag } from 'lucide-react'

import { usePermission } from '@/features/auth/hooks/usePermission'
import { useSaleList } from '@/features/sales/hooks/useSaleList'

export function RecentActivityList() {
  const canViewSales = usePermission('sale:view')

  // Only fetch if they have permission
  const { data, isLoading, isError } = useSaleList({ limit: 5 })

  if (!canViewSales) {
    return (
      <div className="flex h-[150px] items-center justify-center rounded border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        You do not have permission to view recent sales.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[150px] items-center justify-center rounded border border-dashed bg-muted/30">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-[150px] items-center justify-center rounded border border-dashed border-destructive/50 bg-destructive/10 text-sm text-destructive">
        Failed to load recent activity.
      </div>
    )
  }

  const sales = data?.sales || []

  if (sales.length === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center rounded border border-dashed bg-muted/30 text-sm text-muted-foreground">
        No recent sales found.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sales.map((sale) => (
        <div
          key={sale._id}
          className="flex items-center justify-between rounded-md border p-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-500">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Sale #{sale._id.slice(-6).toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(sale.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500">
              +${sale.grandTotal.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{sale.items.length} items</p>
          </div>
        </div>
      ))}
    </div>
  )
}
