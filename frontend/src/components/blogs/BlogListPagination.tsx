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
  canManageBlogs?: boolean
}

export function BlogListPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  selectedCount,
  visibleCount,
  onPageChange,
  canManageBlogs = false,
}: BlogListPaginationProps) {
  const fromItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const toItem = Math.min(page * pageSize, totalItems)

  return (
    <div className="mt-4 flex flex-col gap-2 text-xs text-slate-400 sm:mt-8 sm:gap-3 sm:text-sm md:flex-row md:items-center md:justify-between md:text-base">
      {canManageBlogs ? (
        <p className="text-center md:text-left">
          {selectedCount} of {visibleCount} row(s) selected.
        </p>
      ) : (
        <div />
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:justify-end">
        <p className="whitespace-nowrap">
          {fromItem}-{toItem} of {totalItems}
        </p>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="h-auto rounded-full border-slate-300 p-1 text-slate-500 disabled:opacity-40"
            aria-label="First page"
          >
            <ChevronsLeft className="size-3.5 sm:size-4" />
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
            <ChevronLeft className="size-3.5 sm:size-4" />
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
            <ChevronRight className="size-3.5 sm:size-4" />
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
            <ChevronsRight className="size-3.5 sm:size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
