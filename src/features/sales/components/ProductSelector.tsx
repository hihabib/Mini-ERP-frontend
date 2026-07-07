import { Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { env } from '@/config/env'
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
    limit: 20, // Fetch more for scrolling
    page: 1,
  })

  const handleProductClick = (product: Product) => {
    if (product.stockQuantity <= 0) {
      toast.error(
        `We don't have enough stock quantity of ${product.name} to add in the right side cart.`,
      )
      return
    }
    onSelect(product)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative shrink-0 mb-4">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products to add…"
          className="pl-8"
          aria-label="Search products to add"
        />
      </div>

      <div className="flex-1 overflow-y-auto rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-12">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Loading products…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.products.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
            {data?.products.map((product) => {
              const alreadyAdded = selectedProductIds.includes(product._id)
              const outOfStock = product.stockQuantity <= 0

              return (
                <TableRow
                  key={product._id}
                  className={`cursor-pointer transition-colors ${
                    alreadyAdded ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'
                  } ${outOfStock ? 'opacity-60' : ''}`}
                  onClick={() => handleProductClick(product)}
                  data-testid={`selector-product-${product._id}`}
                >
                  <TableCell className="p-2">
                    {product.imageUrl ? (
                      <img
                        src={`${env.socketUrl}${product.imageUrl}`}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover shadow-sm"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground">No img</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="p-2">
                    <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </TableCell>
                  <TableCell className="p-2 text-right font-medium text-primary">
                    ${product.sellingPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="p-2 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          outOfStock
                            ? 'bg-destructive/10 text-destructive'
                            : product.stockQuantity < 5
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                        }`}
                        data-testid={`product-stock-${product._id}`}
                      >
                        {outOfStock ? 'Out of Stock' : `Stock: ${product.stockQuantity}`}
                      </span>
                      {alreadyAdded && (
                        <span className="text-[10px] font-semibold text-primary">+qty</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
