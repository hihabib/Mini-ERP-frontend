import { LowStockList } from '../components/LowStockList'
import { StatsGrid } from '../components/StatsGrid'
import { useDashboardStats } from '../hooks/useDashboardStats'

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats()

  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <p className="text-destructive">Failed to load dashboard stats. Try refreshing.</p>
      )}

      {data && (
        <div className="space-y-8">
          <StatsGrid stats={data} />
          <LowStockList stats={data} />
        </div>
      )}
    </main>
  )
}
