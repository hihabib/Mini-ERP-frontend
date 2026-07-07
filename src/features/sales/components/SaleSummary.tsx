import type { Product } from '@/types/product.types'

interface LineItemLike {
  product: Pick<Product, 'sellingPrice'>
  quantity: number
}

interface SaleSummaryProps {
  items: LineItemLike[]
}

export function SaleSummary({ items }: SaleSummaryProps) {
  const grandTotal = items.reduce((sum, item) => sum + item.quantity * item.product.sellingPrice, 0)

  return (
    <div className="flex justify-end rounded-md border p-4">
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Estimated Total</p>
        <p className="text-2xl font-bold" data-testid="grand-total">
          ${grandTotal.toFixed(2)}
        </p>
      </div>
    </div>
  )
}
