import { AlertTriangle, TrendingDown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

import type { DashboardStats } from '../api'

export function LowStockList({ stats }: { stats: DashboardStats }) {
  const { lowStockProducts, lowStockCount } = stats
  const overflow = lowStockCount - lowStockProducts.length

  return (
    <div className="rounded-xl border bg-card shadow-sm flex flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between border-b p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Low Stock Alerts</h2>
        </div>
        {lowStockCount > 0 && (
          <Badge
            variant="destructive"
            className="rounded-full px-3 py-1 text-sm font-medium"
            data-testid="low-stock-count-badge"
          >
            {lowStockCount} Issue{lowStockCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="flex-1 p-0">
        {lowStockProducts.length === 0 ? (
          <div className="flex h-[250px] flex-col items-center justify-center p-6 text-center">
            <div className="rounded-full bg-emerald-100 p-3 mb-4 dark:bg-emerald-900/20">
              <TrendingDown className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
            </div>
            <p className="text-lg font-medium text-slate-900 dark:text-slate-50">All Good!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your inventory levels look healthy.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <ul className="divide-y">
              {lowStockProducts.map((product) => (
                <li
                  key={product._id}
                  className="flex items-center justify-between p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium leading-none">{product.name}</span>
                    <span className="text-sm text-muted-foreground">{product.sku}</span>
                  </div>
                  <Badge
                    variant="destructive"
                    className="ml-4 tabular-nums"
                    data-testid={`low-stock-item-${product._id}`}
                  >
                    {product.stockQuantity} left
                  </Badge>
                </li>
              ))}
            </ul>
            {overflow > 0 && (
              <div className="border-t bg-slate-50 p-4 text-center dark:bg-slate-900/20">
                <p className="text-sm font-medium text-muted-foreground">
                  +{overflow} more products running low
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
