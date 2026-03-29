import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortColumnChevronsProps = {
  /** When true, the chevron matching `direction` uses the primary (active) color */
  active: boolean
  direction: 'asc' | 'desc'
  className?: string
}

export function SortColumnChevrons({
  active,
  direction,
  className,
}: SortColumnChevronsProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 flex-col items-center justify-center leading-none',
        className
      )}
      aria-hidden
    >
      <ChevronUp
        strokeWidth={2.5}
        className={cn(
          'h-2.5 w-2.5 sm:h-3 sm:w-3 2xl:h-3 2xl:w-3',
          active && direction === 'asc'
            ? 'text-primary'
            : 'text-muted-foreground'
        )}
      />
      <ChevronDown
        strokeWidth={2.5}
        className={cn(
          '-mt-1 h-2.5 w-2.5 sm:h-3 sm:w-3 2xl:h-3 2xl:w-3',
          active && direction === 'desc'
            ? 'text-primary'
            : 'text-muted-foreground'
        )}
      />
    </span>
  )
}
