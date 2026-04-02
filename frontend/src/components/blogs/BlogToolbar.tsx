import { Download, Trash2 } from 'lucide-react'
import { Button, SearchInput } from '@/components/ui'
import { StatusFilterDropdown } from './StatusFilterDropdown'
import type { StatusFilter } from './types'

export interface BlogToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
  onExportCsv: () => void
  onDeleteSelected: () => void
  hasSelection?: boolean
  canManageBlogs?: boolean
}

export function BlogToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onExportCsv,
  onDeleteSelected,
  hasSelection = false,
  canManageBlogs = false,
}: BlogToolbarProps) {
  return (
    <div className="mt-4 flex flex-col gap-2 sm:mt-8 sm:gap-3 md:flex-row md:items-center md:justify-end">
      <SearchInput
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search blogs..."
        className="w-full md:max-w-xs"
        showClearButton={false}
      />

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onExportCsv}
          className="flex-1 rounded-xl border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 sm:flex-none"
          leftIcon={<Download className="size-4" />}
        >
          <span className="hidden text-sm xs:inline">Excel</span>
        </Button>

        {canManageBlogs ? (
          <StatusFilterDropdown
            value={statusFilter}
            onChange={onStatusFilterChange}
          />
        ) : null}

        {canManageBlogs ? (
          <Button
            type="button"
            variant="outline"
            onClick={onDeleteSelected}
            disabled={!hasSelection}
            className="rounded-xl border-slate-200 px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Delete selected blogs"
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
