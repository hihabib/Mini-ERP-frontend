import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { env } from '@/config/env'
import { ApiClientError } from '@/lib/api/ApiClientError'

const backendBase = env.socketUrl

// Use z.number() (not z.coerce) + { valueAsNumber: true } in register so
// react-hook-form delivers numbers directly — avoids Zod v4 coerce/resolver
// type mismatch where coerce fields resolve to `unknown` as input type.
const productSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(200),
  sku: z.string().min(2, 'At least 2 characters').max(50),
  category: z.string().min(2, 'At least 2 characters').max(100),
  purchasePrice: z.number().min(0, 'Must be ≥ 0'),
  sellingPrice: z.number().min(0, 'Must be ≥ 0'),
  stockQuantity: z.number().int().min(0, 'Must be ≥ 0'),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>
  existingImageUrl?: string
  onSubmit: (data: FormData) => Promise<void>
  isCreate?: boolean
  submitLabel?: string
}

export function ProductForm({
  defaultValues,
  existingImageUrl,
  onSubmit,
  isCreate = false,
  submitLabel = 'Save',
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { stockQuantity: 0, purchasePrice: 0, sellingPrice: 0, ...defaultValues },
  })

  const fileRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setImageError(null)
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  async function onValid(values: ProductFormValues) {
    const file = fileRef.current?.files?.[0]

    if (isCreate && !file) {
      setImageError('An image is required')
      return
    }

    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('sku', values.sku)
    formData.append('category', values.category)
    formData.append('purchasePrice', String(values.purchasePrice))
    formData.append('sellingPrice', String(values.sellingPrice))
    formData.append('stockQuantity', String(values.stockQuantity))
    if (file) formData.append('image', file)

    try {
      await onSubmit(formData)
    } catch (err) {
      if (err instanceof ApiClientError && err.errors) {
        for (const [field, message] of Object.entries(err.errors)) {
          setError(field as keyof ProductFormValues, { message })
        }
      }
    }
  }

  const displayImage = previewUrl ?? (existingImageUrl ? `${backendBase}${existingImageUrl}` : null)

  return (
    <form onSubmit={handleSubmit(onValid)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register('name')} aria-invalid={!!errors.name} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" {...register('sku')} aria-invalid={!!errors.sku} />
        {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Category</Label>
        <Input id="category" {...register('category')} aria-invalid={!!errors.category} />
        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="purchasePrice">Purchase price ($)</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="0.01"
            min="0"
            {...register('purchasePrice', { valueAsNumber: true })}
            aria-invalid={!!errors.purchasePrice}
          />
          {errors.purchasePrice && (
            <p className="text-sm text-destructive">{errors.purchasePrice.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sellingPrice">Selling price ($)</Label>
          <Input
            id="sellingPrice"
            type="number"
            step="0.01"
            min="0"
            {...register('sellingPrice', { valueAsNumber: true })}
            aria-invalid={!!errors.sellingPrice}
          />
          {errors.sellingPrice && (
            <p className="text-sm text-destructive">{errors.sellingPrice.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stockQuantity">Stock quantity</Label>
        <Input
          id="stockQuantity"
          type="number"
          min="0"
          {...register('stockQuantity', { valueAsNumber: true })}
          aria-invalid={!!errors.stockQuantity}
        />
        {errors.stockQuantity && (
          <p className="text-sm text-destructive">{errors.stockQuantity.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">
          Image{isCreate && <span className="ml-1 text-destructive">*</span>}
        </Label>
        {displayImage && (
          <img
            src={displayImage}
            alt="Product preview"
            className="mb-2 h-32 w-32 rounded object-cover"
          />
        )}
        <Input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          ref={fileRef}
          onChange={handleFileChange}
          aria-invalid={!!imageError}
          aria-describedby={imageError ? 'image-error' : undefined}
        />
        {imageError && (
          <p id="image-error" role="alert" className="text-sm text-destructive">
            {imageError}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
