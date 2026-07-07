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
    <div className="overflow-hidden rounded-md border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p
            className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
            data-testid={testId}
          >
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={cn('flex h-10 w-10 items-center justify-center rounded-sm', iconBgClassName)}
          >
            <Icon className={cn('h-5 w-5', iconClassName)} />
          </div>
        )}
      </div>
    </div>
  )
}
