import { BlogPageHeader } from './BlogPageHeader'
import { BlogToolbar } from './BlogToolbar'
import type { StatusFilter } from './types'

export interface BlogFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
  onExportCsv: () => void
  onDeleteSelected: () => void
  onNewBlog: () => void
  hasSelection?: boolean
  canManageBlogs?: boolean
}

export function BlogFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onExportCsv,
  onDeleteSelected,
  onNewBlog,
  hasSelection = false,
  canManageBlogs = false,
}: BlogFiltersProps) {
  return (
    <>
      <BlogPageHeader onNewBlog={onNewBlog} canManageBlogs={canManageBlogs} />
      <BlogToolbar
        search={search}
        onSearchChange={onSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        onExportCsv={onExportCsv}
        onDeleteSelected={onDeleteSelected}
        hasSelection={hasSelection}
        canManageBlogs={canManageBlogs}
      />
    </>
  )
}
