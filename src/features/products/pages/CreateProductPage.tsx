import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { ProductForm } from '../components/ProductForm'
import { useCreateProduct } from '../hooks/useCreateProduct'

export default function CreateProductPage() {
  const navigate = useNavigate()
  const { mutateAsync } = useCreateProduct()

  async function handleSubmit(data: FormData) {
    await mutateAsync(data)
    toast.success('Product created')
    navigate('/products')
  }

  return (
    <main className="p-8">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/products')} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Add Product</h1>
      </div>

      <div className="max-w-lg">
        <ProductForm isCreate onSubmit={handleSubmit} submitLabel="Create Product" />
      </div>
    </main>
  )
}
