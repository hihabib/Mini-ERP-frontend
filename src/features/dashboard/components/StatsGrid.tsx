import { StatCard } from './StatCard'

import type { DashboardStats } from '../api'

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Total Products" value={stats.totalProducts} testId="stat-total-products" />
      <StatCard label="Total Sales" value={stats.totalSales} testId="stat-total-sales" />
      <StatCard
        label="Total Revenue"
        value={`$${stats.totalRevenue.toFixed(2)}`}
        testId="stat-total-revenue"
      />
    </div>
  )
}
