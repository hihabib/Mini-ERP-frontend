import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ApiClientError } from '@/lib/api/ApiClientError'

import { ProductSelector } from '../components/ProductSelector'
import { SaleLineItem } from '../components/SaleLineItem'
import { SaleSummary } from '../components/SaleSummary'
import { useCreateSale } from '../hooks/useCreateSale'

import type { Product } from '@/types/product.types'

interface LineItem {
  product: Product
  quantity: number
}

export default function CreateSalePage() {
  const [items, setItems] = useState<LineItem[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  const { mutateAsync, isPending } = useCreateSale()

  function handleSelect(product: Product) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.product._id === product._id)
      if (idx !== -1) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
        return next
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  function handleQuantityChange(productId: string, quantity: number) {
    setItems((prev) => prev.map((i) => (i.product._id === productId ? { ...i, quantity } : i)))
  }

  function handleRemove(productId: string) {
    setItems((prev) => prev.filter((i) => i.product._id !== productId))
  }

  async function handleSubmit() {
    setValidationError(null)

    if (items.length === 0) {
      setValidationError('Add at least one product to create a sale.')
      return
    }

    try {
      const sale = await mutateAsync({
        items: items.map((i) => ({ product: i.product._id, quantity: i.quantity })),
      })
      toast.success(`Sale created — Total: $${sale.grandTotal.toFixed(2)}`)
      setItems([])
    } catch (err) {
      if (err instanceof ApiClientError) {
        setValidationError(err.message)
      }
    }
  }

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">New Sale</h1>

      <div className="max-w-2xl space-y-4">
        <ProductSelector
          selectedProductIds={items.map((i) => i.product._id)}
          onSelect={handleSelect}
        />

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item) => (
              <SaleLineItem
                key={item.product._id}
                product={item.product}
                quantity={item.quantity}
                onQuantityChange={(q) => handleQuantityChange(item.product._id, q)}
                onRemove={() => handleRemove(item.product._id)}
              />
            ))}
          </div>
        )}

        {items.length > 0 && <SaleSummary items={items} />}

        {validationError && (
          <p role="alert" className="text-sm text-destructive">
            {validationError}
          </p>
        )}

        <Button onClick={handleSubmit} disabled={isPending} className="w-full">
          {isPending ? 'Processing…' : 'Complete Sale'}
        </Button>
      </div>
    </main>
  )
}
