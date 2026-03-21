import { Filter, FileUp } from 'lucide-react'
import { SearchInput } from '@/components/ui'

export interface SubjectFiltersProps {
  search: string
  onSearchChange: (value: string) => void
}

export function SubjectFilters({
  search,
  onSearchChange,
}: SubjectFiltersProps) {
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
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring sm:h-10 sm:gap-2 sm:px-3 sm:text-sm md:px-4 2xl:h-11 2xl:px-5 2xl:text-base"
          aria-label="Filter"
        >
          <Filter className="h-4 w-4 2xl:h-5 2xl:w-5" />
          <span className="hidden sm:inline">Filter</span>
        </button>
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
