import { Download, Filter, Plus, Trash2 } from 'lucide-react'
import { Button, SearchInput } from '@/components/ui'
import type { StatusFilter } from './types'

export interface BlogFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: StatusFilter
  onExportCsv: () => void
  onToggleStatusFilter: () => void
  onDeleteSelected: () => void
  onNewBlog: () => void
}

export function BlogFilters({
  search,
  onSearchChange,
  statusFilter,
  onExportCsv,
  onToggleStatusFilter,
  onDeleteSelected,
  onNewBlog,
}: BlogFiltersProps) {
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800">Blogs</h1>
          <p className="mt-1 text-lg text-slate-600">
            Share knowledge and insights with the community
          </p>
        </div>

        <Button
          type="button"
          onClick={onNewBlog}
          className="rounded-xl bg-slate-600 px-5 py-3 text-lg font-medium text-white hover:bg-slate-700"
          leftIcon={<Plus className="size-5" />}
        >
          New Blog
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
        <SearchInput
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="search......"
          className="w-full md:max-w-xs"
          showClearButton={false}
        />

        <Button
          type="button"
          variant="outline"
          onClick={onExportCsv}
          className="rounded-xl border-slate-200 px-4 py-2.5 text-lg text-slate-700 hover:bg-slate-50"
          leftIcon={<Download className="size-5" />}
        >
          Excel
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onToggleStatusFilter}
          className="rounded-xl border-slate-200 px-3 py-2.5 text-lg text-slate-700 hover:bg-slate-50"
          leftIcon={<Filter className="size-5" />}
        >
          <span className="hidden sm:inline">{statusFilter}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onDeleteSelected}
          className="rounded-xl border-slate-200 px-3 py-2.5 text-lg text-slate-700 hover:bg-slate-50"
          aria-label="Delete selected blogs"
        >
          <Trash2 className="size-5" />
        </Button>
      </div>
    </>
  )
}
