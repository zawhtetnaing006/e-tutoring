import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuditLogSortDir, AuditLogSortKey } from './sorting'

const SORT_ICON_CLASS =
  'pointer-events-none h-3.5 w-3.5 shrink-0 2xl:h-4 2xl:w-4'

type AuditLogSortPairProps = {
  columnKey: AuditLogSortKey
  sortKey: AuditLogSortKey
  sortDir: AuditLogSortDir
  onApplySort: (key: AuditLogSortKey, dir: AuditLogSortDir) => void
}

/** Stacked up/down controls: separate click targets; active direction uses stronger contrast. */
export function AuditLogSortPair({
  columnKey,
  sortKey,
  sortDir,
  onApplySort,
}: AuditLogSortPairProps) {
  const upStrong = sortKey === columnKey && sortDir === 'asc'
  const downStrong = sortKey === columnKey && sortDir === 'desc'

  return (
    <span
      className="inline-flex shrink-0 flex-col items-center gap-0 leading-none [&>button+button]:-mt-1"
      role="group"
      aria-label="Sort"
    >
      <button
        type="button"
        onClick={() => onApplySort(columnKey, 'asc')}
        className="rounded px-0.5 py-0 text-foreground hover:bg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Sort ascending"
        aria-pressed={upStrong}
      >
        <ChevronUp
          className={cn(
            SORT_ICON_CLASS,
            upStrong ? 'text-foreground' : 'text-muted-foreground/55'
          )}
          strokeWidth={2.5}
        />
      </button>
      <button
        type="button"
        onClick={() => onApplySort(columnKey, 'desc')}
        className="rounded px-0.5 py-0 text-foreground hover:bg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Sort descending"
        aria-pressed={downStrong}
      >
        <ChevronDown
          className={cn(
            SORT_ICON_CLASS,
            downStrong ? 'text-foreground' : 'text-muted-foreground/55'
          )}
          strokeWidth={2.5}
        />
      </button>
    </span>
  )
}
