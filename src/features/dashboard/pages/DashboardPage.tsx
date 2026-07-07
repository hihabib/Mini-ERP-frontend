import { LowStockList } from '../components/LowStockList'
import { RecentActivityList } from '../components/RecentActivityList'
import { StatsGrid } from '../components/StatsGrid'
import { useDashboardStats } from '../hooks/useDashboardStats'

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats()

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome back! Here is a summary of your store&apos;s performance.
        </p>
      </div>

      {isLoading && (
        <div className="flex h-[300px] items-center justify-center rounded-md border border-dashed bg-slate-50/50 dark:bg-slate-900/20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
          <p className="font-semibold text-sm">Failed to load dashboard stats.</p>
          <p className="text-xs opacity-90">Please check your connection and try refreshing.</p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <StatsGrid stats={data} />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border bg-card p-4 shadow-sm flex flex-col">
              <h2 className="mb-3 text-lg font-semibold tracking-tight">Recent Activity</h2>
              <div className="flex-1">
                <RecentActivityList />
              </div>
            </div>

            <div className="space-y-4">
              <LowStockList stats={data} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
