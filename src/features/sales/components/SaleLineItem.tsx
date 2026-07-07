import { useQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getProduct } from '@/features/products/api'

import type { Product } from '@/types/product.types'

interface SaleLineItemProps {
  product: Product
  quantity: number
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function SaleLineItem({ product, quantity, onQuantityChange, onRemove }: SaleLineItemProps) {
  // Subscribe to individual product cache so socket-driven stock updates re-render this row.
  // initialData prevents a network request; staleTime: Infinity means only socket can update it.
  const { data: current } = useQuery({
    queryKey: ['product', product._id],
    queryFn: () => getProduct(product._id),
    initialData: product,
    staleTime: Infinity,
  })

  const stock = current?.stockQuantity ?? product.stockQuantity
  const subtotal = quantity * product.sellingPrice

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10)
    if (!isNaN(val) && val >= 1) {
      onQuantityChange(Math.min(val, stock))
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <div className="flex-1">
        <p className="font-medium">{product.name}</p>
        <p className="text-sm text-muted-foreground">
          {product.sku} · ${product.sellingPrice.toFixed(2)} each
          {stock <= 0 && <span className="ml-2 text-destructive">Out of stock</span>}
          {stock > 0 && stock < 5 && <span className="ml-2 text-amber-600">Only {stock} left</span>}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor={`qty-${product._id}`} className="sr-only">
          Quantity for {product.name}
        </label>
        <Input
          id={`qty-${product._id}`}
          type="number"
          min={1}
          max={stock}
          value={quantity}
          onChange={handleChange}
          className="w-20"
          aria-label={`Quantity for ${product.name}`}
        />
        <span
          className="w-24 text-right text-sm font-medium"
          data-testid={`subtotal-${product._id}`}
        >
          ${subtotal.toFixed(2)}
        </span>
      </div>

      <Button variant="ghost" size="icon" aria-label={`Remove ${product.name}`} onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  )
}
