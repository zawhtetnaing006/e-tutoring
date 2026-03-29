import { useState, useEffect, useRef } from 'react'
import { Filter, FileUp } from 'lucide-react'
import { SearchInput } from '@/components/ui'
import type { SubjectStatusFilter } from '@/pages/lists/useSubjectListPage'

export interface SubjectFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: SubjectStatusFilter
  onStatusFilterChange: (value: SubjectStatusFilter) => void
}

export function SubjectFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: SubjectFiltersProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const filterWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!filterOpen) return
    const onDoc = (e: MouseEvent) => {
      if (
        filterWrapRef.current &&
        !filterWrapRef.current.contains(e.target as Node)
      ) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [filterOpen])

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-6 sm:justify-end sm:gap-3 2xl:mb-8 2xl:gap-4">
      <SearchInput
        placeholder="Search..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        showClearButton={false}
        className="relative w-full min-w-0 sm:w-auto sm:min-w-[140px] sm:max-w-[240px] sm:flex-1 2xl:max-w-[320px]"
        iconClassName="absolute left-2.5 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground sm:left-3 2xl:h-5 2xl:w-5"
        inputClassName="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:h-10 sm:pl-10 sm:pr-4 sm:text-sm 2xl:h-11 2xl:pl-11 2xl:text-base"
      />
      <div className="flex shrink-0 gap-2 sm:gap-3 2xl:gap-4">
        <div ref={filterWrapRef} className="relative overflow-visible">
          <button
            type="button"
            onClick={() => setFilterOpen(o => !o)}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring sm:h-10 sm:gap-2 sm:px-3 sm:text-sm md:px-4 2xl:h-11 2xl:px-5 2xl:text-base ${
              statusFilter !== 'all' ? 'ring-2 ring-primary/30' : ''
            }`}
            aria-label="Filter"
            aria-expanded={filterOpen}
          >
            <Filter className="h-4 w-4 2xl:h-5 2xl:w-5" />
            <span className="hidden sm:inline">Filter</span>
          </button>
          {filterOpen && (
            <div
              className="absolute left-0 top-full z-[100] mt-1 max-w-[min(100vw-1.5rem,20rem)] rounded-lg border border-border bg-card p-3 shadow-lg sm:left-auto sm:right-0 sm:min-w-[200px] sm:max-w-none 2xl:min-w-[240px] 2xl:p-4"
              role="dialog"
              aria-label="Filters"
            >
              <p className="mb-2 text-xs font-medium text-foreground 2xl:text-sm">
                Status
              </p>
              <div className="flex flex-col gap-1">
                {[
                  ['all', 'All'] as const,
                  ['active', 'Active'] as const,
                  ['inactive', 'Inactive'] as const,
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      onStatusFilterChange(value)
                      setFilterOpen(false)
                    }}
                    className={`rounded-md px-2 py-1.5 text-left text-xs 2xl:px-3 2xl:py-2 2xl:text-sm ${
                      statusFilter === value
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring sm:h-10 sm:gap-2 sm:px-3 sm:text-sm md:px-4 2xl:h-11 2xl:px-5 2xl:text-base"
        >
          <FileUp className="h-4 w-4 2xl:h-5 2xl:w-5" />
          <span className="hidden sm:inline">Excel</span>
        </button>
      </div>
    </div>
  )
}
