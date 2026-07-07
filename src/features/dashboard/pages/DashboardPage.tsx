import { LowStockList } from '../components/LowStockList'
import { StatsGrid } from '../components/StatsGrid'
import { useDashboardStats } from '../hooks/useDashboardStats'

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboardStats()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here is a summary of your store&apos;s performance.
        </p>
      </div>

      {isLoading && (
        <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed bg-slate-50/50 dark:bg-slate-900/20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
          <p className="font-semibold">Failed to load dashboard stats.</p>
          <p className="text-sm opacity-90">Please check your connection and try refreshing.</p>
        </div>
      )}

      {data && (
        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div className="space-y-8">
            <StatsGrid stats={data} />
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold tracking-tight">Recent Activity</h2>
              <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed bg-muted/30">
                <p className="text-sm text-muted-foreground">Chart functionality coming soon...</p>
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <LowStockList stats={data} />
          </div>
        </div>
      )}
    </div>
  )
}
