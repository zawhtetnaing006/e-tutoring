import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/utils/formatters'

export interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  isValueDate?: boolean
  /** When `isValueDate` is true, use this instead of the default `formatDateTime`. */
  formatDateValue?: (iso: string) => string
  variant?: 'default' | 'warning' | 'danger' | 'info' | 'success'
  className?: string
}

export function StatCard({
  icon,
  label,
  value,
  isValueDate = false,
  formatDateValue,
  variant = 'default',
  className,
}: StatCardProps) {
  let iconColorClass: string
  switch (variant) {
    case 'warning':
      iconColorClass = 'text-yellow-600'
      break
    case 'danger':
      iconColorClass = 'text-red-600'
      break
    case 'info':
      iconColorClass = 'text-cyan-600'
      break
    case 'success':
      iconColorClass = 'text-green-600'
      break
    default:
      iconColorClass = 'text-blue-600'
      break
  }

  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6',
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
            {isValueDate
              ? (formatDateValue ?? formatDateTime)(value as string)
              : value}
          </p>
        </div>
        <p className="text-base font-medium text-gray-600">{label}</p>
      </div>
    </div>
  )
}
