import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { getSocket } from '@/lib/socket/socketClient'

import type { ProductListResult } from '../api'
import type { Product } from '@/types/product.types'

interface StockUpdatedEvent {
  productId: string
  stockQuantity: number
}

export function useStockUpdates() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = getSocket()

    function handleStockUpdate({ productId, stockQuantity }: StockUpdatedEvent) {
      queryClient.setQueriesData<ProductListResult>(
        { queryKey: ['products'], exact: false },
        (old) => {
          if (!old) return old
          return {
            ...old,
            products: old.products.map((p) => (p._id === productId ? { ...p, stockQuantity } : p)),
          }
        },
      )
      queryClient.setQueryData<Product>(['product', productId], (old) => {
        if (!old) return old
        return { ...old, stockQuantity }
      })
    }

    socket.on('stock:updated', handleStockUpdate)
    return () => {
      socket.off('stock:updated', handleStockUpdate)
    }
  }, [queryClient])
}
