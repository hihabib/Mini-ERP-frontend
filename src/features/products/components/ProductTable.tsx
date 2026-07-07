import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { env } from '@/config/env'
import { usePermission } from '@/features/auth/hooks/usePermission'

import { DeleteProductDialog } from './DeleteProductDialog'

import type { Product } from '@/types/product.types'

const LOW_STOCK_THRESHOLD = 5

const backendBase = env.socketUrl

interface ProductTableProps {
  products: Product[]
}

export function ProductTable({ products }: ProductTableProps) {
  const navigate = useNavigate()
  const canUpdate = usePermission('product:update')
  const canDelete = usePermission('product:delete')
  const [toDelete, setToDelete] = useState<Product | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Purchase</TableHead>
            <TableHead className="text-right">Selling</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            {(canUpdate || canDelete) && <TableHead className="w-24">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                No products found.
              </TableCell>
            </TableRow>
          )}
          {products.map((product) => {
            const isLowStock = product.stockQuantity < LOW_STOCK_THRESHOLD
            return (
              <TableRow key={product._id} className={isLowStock ? 'bg-amber-50' : undefined}>
                <TableCell>
                  {product.imageUrl ? (
                    <img
                      src={`${backendBase}${product.imageUrl}`}
                      alt={product.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-right">${product.purchasePrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">${product.sellingPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {isLowStock ? (
                    <Badge variant="destructive" data-testid="low-stock-badge">
                      {product.stockQuantity} low
                    </Badge>
                  ) : (
                    <span>{product.stockQuantity}</span>
                  )}
                </TableCell>
                {(canUpdate || canDelete) && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${product.name}`}
                          onClick={() => navigate(`/products/${product._id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => setToDelete(product)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <DeleteProductDialog product={toDelete} onClose={() => setToDelete(null)} />
    </>
  )
}
