import { Search } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { useProductList } from '@/features/products/hooks/useProductList'

import type { Product } from '@/types/product.types'

interface ProductSelectorProps {
  selectedProductIds: string[]
  onSelect: (product: Product) => void
}

export function ProductSelector({ selectedProductIds, onSelect }: ProductSelectorProps) {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useProductList({
    search: search || undefined,
    limit: 8,
    page: 1,
  })

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to add…"
          className="pl-8"
          aria-label="Search products to add"
        />
      </div>

      {search && (
        <ul className="mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-md">
          {isLoading && <li className="px-3 py-2 text-sm text-muted-foreground">Searching…</li>}
          {!isLoading && data?.products.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">No products found</li>
          )}
          {data?.products.map((product) => {
            const alreadyAdded = selectedProductIds.includes(product._id)
            return (
              <li key={product._id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => onSelect(product)}
                  data-testid={`selector-product-${product._id}`}
                >
                  <span>
                    <span className="font-medium">{product.name}</span>
                    <span className="ml-2 text-muted-foreground">{product.sku}</span>
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span data-testid={`product-stock-${product._id}`}>
                      Stock: {product.stockQuantity}
                    </span>
                    {alreadyAdded && (
                      <span className="text-xs text-primary" aria-label="already in sale">
                        +qty
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
