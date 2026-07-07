import { Badge } from '@/components/ui/badge'

import type { DashboardStats } from '../api'

export function LowStockList({ stats }: { stats: DashboardStats }) {
  const { lowStockProducts, lowStockCount } = stats
  const overflow = lowStockCount - lowStockProducts.length

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">
        Low Stock
        {lowStockCount > 0 && (
          <Badge variant="destructive" className="ml-2" data-testid="low-stock-count-badge">
            {lowStockCount} product{lowStockCount !== 1 ? 's' : ''} low on stock
          </Badge>
        )}
      </h2>

      {lowStockProducts.length === 0 ? (
        <p className="text-muted-foreground">All products are well stocked.</p>
      ) : (
        <ul className="space-y-2">
          {lowStockProducts.map((product) => (
            <li
              key={product._id}
              className="flex items-center justify-between rounded border bg-amber-50 px-4 py-2"
            >
              <div>
                <span className="font-medium">{product.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{product.sku}</span>
              </div>
              <Badge variant="destructive" data-testid={`low-stock-item-${product._id}`}>
                {product.stockQuantity} left
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {overflow > 0 && <p className="mt-2 text-sm text-muted-foreground">…and {overflow} more</p>}
    </section>
  )
}
