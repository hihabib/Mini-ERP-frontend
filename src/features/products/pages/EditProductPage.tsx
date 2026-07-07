import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { getProduct } from '../api'
import { ProductForm } from '../components/ProductForm'
import { useUpdateProduct } from '../hooks/useUpdateProduct'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { mutateAsync } = useUpdateProduct()

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  })

  async function handleSubmit(data: FormData) {
    await mutateAsync({ id: id!, data })
    toast.success('Product updated')
    navigate('/products')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !product) {
    return (
      <main className="p-8">
        <p className="text-destructive">Product not found.</p>
      </main>
    )
  }

  return (
    <main className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Edit Product</h1>
      </div>

      <div className="max-w-lg">
        <ProductForm
          defaultValues={{
            name: product.name,
            sku: product.sku,
            category: product.category,
            purchasePrice: product.purchasePrice,
            sellingPrice: product.sellingPrice,
            stockQuantity: product.stockQuantity,
          }}
          existingImageUrl={product.imageUrl}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
        />
      </div>
    </main>
  )
}
