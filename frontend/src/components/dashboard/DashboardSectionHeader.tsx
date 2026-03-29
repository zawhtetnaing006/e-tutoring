import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DashboardSectionHeaderProps = {
  title: ReactNode
  action?: ReactNode
  className?: string
}

export function DashboardSectionHeader({
  title,
  action,
  className,
}: DashboardSectionHeaderProps) {
  return (
    <div
      className={cn(
        'mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
        {title}
      </h3>
      {action ?? null}
    </div>
  )
}
