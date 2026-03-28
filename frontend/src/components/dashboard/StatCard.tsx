import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/formatters'

export interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  isValueDate?: boolean
  variant?: 'default' | 'warning' | 'danger' | 'info' | 'success'
  className?: string
}

export function StatCard({
  icon,
  label,
  value,
  isValueDate = false,
  variant = 'default',
  className,
}: StatCardProps) {
  const iconColorClass = {
    default: 'text-blue-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-cyan-600',
    success: 'text-green-600',
  }[variant]

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6',
        className
      )}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={cn('shrink-0', iconColorClass)}>{icon}</div>
          <p
            className={cn(
              'font-semibold text-gray-900',
              isValueDate ? 'text-sm' : 'text-2xl sm:text-3xl'
            )}
          >
            {isValueDate ? formatDateTime(value as string) : value}
          </p>
        </div>
        <p className="text-base font-medium text-gray-600">{label}</p>
      </div>
    </div>
  )
}
