import { cn } from '@/lib/utils'

import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  testId?: string
  icon?: LucideIcon
  iconClassName?: string
  iconBgClassName?: string
}

export function StatCard({
  label,
  value,
  testId,
  icon: Icon,
  iconClassName,
  iconBgClassName,
}: StatCardProps) {
  return (
    <div className="group overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:ring-1 hover:ring-primary/20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p
            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
            data-testid={testId}
          >
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110',
              iconBgClassName,
            )}
          >
            <Icon className={cn('h-6 w-6', iconClassName)} />
          </div>
        )}
      </div>
    </div>
  )
}
