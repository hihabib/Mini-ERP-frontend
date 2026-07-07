import { useSearchParams } from 'react-router-dom'

import { ProductPagination } from '@/features/products/components/ProductPagination'

import { SaleHistoryTable } from '../components/SaleHistoryTable'
import { useSaleList } from '../hooks/useSaleList'

export default function SaleHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data, isLoading, isError } = useSaleList({ page, limit: 20 })

  function onPageChange(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
  }

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Sale History</h1>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <p className="py-8 text-center text-destructive">Failed to load sales. Try refreshing.</p>
      )}

      {data && (
        <>
          <SaleHistoryTable sales={data.sales} />
          <ProductPagination
            page={page}
            limit={data.meta.limit}
            total={data.meta.total}
            onPageChange={onPageChange}
          />
        </>
      )}
    </main>
  )
}
