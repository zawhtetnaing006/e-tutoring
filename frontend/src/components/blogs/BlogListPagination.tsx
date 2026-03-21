import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Button } from '@/components/ui'

export interface BlogListPaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  selectedCount: number
  visibleCount: number
  onPageChange: (page: number) => void
}

export function BlogListPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  selectedCount,
  visibleCount,
  onPageChange,
}: BlogListPaginationProps) {
  const fromItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const toItem = Math.min(page * pageSize, totalItems)

  return (
    <div className="mt-8 flex flex-col gap-3 text-lg text-slate-400 md:flex-row md:items-center md:justify-between">
      <p>
        {selectedCount} of {visibleCount} row(s) selected.
      </p>

      <div className="flex items-center gap-4">
        <p>
          Showing {fromItem}-{toItem} of {totalItems}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="h-auto rounded-full border-slate-300 p-1 text-slate-500 disabled:opacity-40"
            aria-label="First page"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-auto rounded-full border-slate-300 p-1 text-slate-500 disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="h-auto rounded-full border-slate-300 p-1 text-slate-500 disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            className="h-auto rounded-full border-slate-300 p-1 text-slate-500 disabled:opacity-40"
            aria-label="Last page"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
