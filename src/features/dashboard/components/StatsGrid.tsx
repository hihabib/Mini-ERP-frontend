import { Package, ShoppingCart, DollarSign } from 'lucide-react'

import { StatCard } from './StatCard'

import type { DashboardStats } from '../api'

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Total Products"
        value={stats.totalProducts}
        testId="stat-total-products"
        icon={Package}
        iconClassName="text-blue-500"
        iconBgClassName="bg-blue-100 dark:bg-blue-900/30"
      />
      <StatCard
        label="Total Sales"
        value={stats.totalSales}
        testId="stat-total-sales"
        icon={ShoppingCart}
        iconClassName="text-emerald-500"
        iconBgClassName="bg-emerald-100 dark:bg-emerald-900/30"
      />
      <StatCard
        label="Total Revenue"
        value={`$${stats.totalRevenue.toFixed(2)}`}
        testId="stat-total-revenue"
        icon={DollarSign}
        iconClassName="text-purple-500"
        iconBgClassName="bg-purple-100 dark:bg-purple-900/30"
      />
    </div>
  )
}
