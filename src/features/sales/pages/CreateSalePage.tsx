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
    <main className="flex flex-col min-h-full">
      <h1 className="mb-4 text-2xl font-semibold shrink-0">New Sale</h1>

      <div className="grid gap-4 lg:grid-cols-[1fr_450px] flex-1 min-h-0">
        {/* Left Side: Product Selector */}
        <div className="flex flex-col min-h-[500px] bg-card rounded-md border p-3 shadow-sm overflow-hidden">
          <ProductSelector
            selectedProductIds={items.map((i) => i.product._id)}
            onSelect={handleSelect}
          />
        </div>

        {/* Right Side: Cart */}
        <div className="flex flex-col bg-card rounded-md border shadow-sm overflow-hidden">
          <div className="p-3 border-b bg-muted/30">
            <h2 className="font-semibold text-base">Current Order</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[300px]">
            {items.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                <p className="text-sm">No items added yet.</p>
                <p className="text-xs text-center mt-1">Select products from the left.</p>
              </div>
            )}
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

          <div className="p-3 border-t bg-muted/10 space-y-3 shrink-0">
            {items.length > 0 && <SaleSummary items={items} />}

            {validationError && (
              <p role="alert" className="text-sm text-destructive font-medium">
                {validationError}
              </p>
            )}

            <Button onClick={handleSubmit} disabled={isPending} className="w-full h-10 text-base">
              {isPending ? 'Processing…' : 'Complete Sale'}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
