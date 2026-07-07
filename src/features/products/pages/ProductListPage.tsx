import { Plus } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { usePermission } from '@/features/auth/hooks/usePermission'

import { ProductPagination } from '../components/ProductPagination'
import { ProductSearchBar } from '../components/ProductSearchBar'
import { ProductTable } from '../components/ProductTable'
import { useProductList } from '../hooks/useProductList'

export default function ProductListPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const canCreate = usePermission('product:create')

  const search = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? ''
  const sort = searchParams.get('sort') ?? ''
  const page = Number(searchParams.get('page') ?? '1')

  function setParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      if (key !== 'page') next.set('page', '1')
      return next
    })
  }

  const { data, isLoading, isError } = useProductList({
    search: search || undefined,
    category: category || undefined,
    sort: sort || undefined,
    page,
    limit: 10,
  })

  return (
    <main className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        {canCreate && (
          <Button onClick={() => navigate('/products/new')}>
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      <div className="mb-4">
        <ProductSearchBar value={search} onChange={(v) => setParam('search', v)} />
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <p className="py-8 text-center text-destructive">
          Failed to load products. Try refreshing.
        </p>
      )}

      {data && (
        <>
          <ProductTable products={data.products} />
          <ProductPagination
            page={page}
            limit={data.meta.limit}
            total={data.meta.total}
            onPageChange={(p) => setParam('page', String(p))}
          />
        </>
      )}
    </main>
  )
}
