import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Search, Filter, FileUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuditLogs } from '@/features/audit-logs/useAuditLogs'
import type { AuditLogRoleSlug } from '@/features/audit-logs/api'
import { AUDIT_LOG_ROWS_PER_PAGE_OPTIONS } from '@/features/audit-logs/constants'
import { filterAuditLogsByRoleSlugs } from '@/features/audit-logs/filterAuditLogs'
import {
  formatAuditLogDateTime,
  auditLogRowKey,
} from '@/features/audit-logs/format'
import {
  compareAuditLogRows,
  ariaSortForAuditColumn,
  type AuditLogSortKey,
  type AuditLogSortDir,
} from '@/features/audit-logs/sorting'
import { AUDIT_LOG_TABLE_COLUMNS } from '@/features/audit-logs/auditLogTableColumns'
import { AuditLogSortPair } from '@/features/audit-logs/AuditLogSortPair'
import { AuditLogActorCell } from '@/features/audit-logs/AuditLogActorCell'
import {
  computeAuditLogFilterDropdownRect,
  type AuditLogFilterAnchorRect,
} from '@/features/audit-logs/auditLogRoleFilterPlacement'
import { AuditLogRoleFilterPanel } from '@/features/audit-logs/AuditLogRoleFilterPanel'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'

const TABLE_COLUMN_COUNT = 6

const TABLE_STATUS_CELL_CLASS = 'p-6 text-center sm:p-8 2xl:p-12 2xl:text-lg'

const PAGINATION_NAV_BTN_CLASS =
  'rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:p-2 2xl:p-2.5'

const PAGINATION_ICON_CLASS = 'h-3.5 w-3.5 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5'

export function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<AuditLogRoleSlug[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterDropdownRect, setFilterDropdownRect] =
    useState<AuditLogFilterAnchorRect | null>(null)
  const [sortKey, setSortKey] = useState<AuditLogSortKey>('date_time')
  const [sortDir, setSortDir] = useState<AuditLogSortDir>('desc')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const closeRoleFilter = useCallback(() => {
    setFilterOpen(false)
    setFilterDropdownRect(null)
  }, [])

  const prevDebouncedRef = useRef<string | null>(null)
  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = searchInput.trim()
      setDebouncedSearch(next)
      if (
        prevDebouncedRef.current !== null &&
        prevDebouncedRef.current !== next
      ) {
        setPage(1)
      }
      prevDebouncedRef.current = next
    }, 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const { data, isLoading, isError, error, isFetching } = useAuditLogs({
    page,
    perPage,
    search: debouncedSearch,
  })

  const totalPages = Math.max(1, data?.total_page ?? 1)
  const activePage = data?.current_page ?? page

  const serverRows = data?.data
  const rows = useMemo(
    () => filterAuditLogsByRoleSlugs(serverRows ?? [], roleFilter),
    [serverRows, roleFilter]
  )

  const sortedRows = useMemo(() => {
    const list = [...rows]
    list.sort((a, b) => compareAuditLogRows(a, b, sortKey, sortDir))
    return list
  }, [rows, sortKey, sortDir])

  const tableBodyScroll = !isLoading && !isError && sortedRows.length > 10

  const totalItems = data?.total_items ?? 0
  const start = (activePage - 1) * perPage + 1
  const end = Math.min(activePage * perPage, totalItems)

  const allSelected =
    sortedRows.length > 0 &&
    sortedRows.every(r => selectedIds.has(auditLogRowKey(r)))
  const someSelected = sortedRows.some(r => selectedIds.has(auditLogRowKey(r)))

  const applySort = (key: AuditLogSortKey, dir: AuditLogSortDir) => {
    setSortKey(key)
    setSortDir(dir)
  }

  const toggleRoleFilter = (value: AuditLogRoleSlug) => {
    setRoleFilter(prev => {
      const has = prev.includes(value)
      return has ? prev.filter(r => r !== value) : [...prev, value]
    })
    setPage(1)
  }

  const selectAllRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = selectAllRef.current
    if (el) el.indeterminate = someSelected && !allSelected
  }, [someSelected, allSelected])

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sortedRows.map(r => auditLogRowKey(r))))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-foreground sm:text-xl 2xl:text-2xl">
            Audit Log
          </h1>
          <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm lg:text-base">
            Monitor and review system activities and user actions for
            accountability and security.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-6 sm:justify-end sm:gap-3 2xl:mb-8 2xl:gap-4">
        <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[140px] sm:max-w-[240px] sm:flex-1 2xl:max-w-[320px]">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground sm:left-3 2xl:h-5 2xl:w-5"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:h-10 sm:pl-10 sm:pr-4 sm:text-sm 2xl:h-11 2xl:pl-11 2xl:text-base"
          />
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:gap-3 2xl:gap-4">
          <button
            type="button"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              if (filterOpen) {
                closeRoleFilter()
              } else {
                setFilterDropdownRect(computeAuditLogFilterDropdownRect(rect))
                setFilterOpen(true)
              }
            }}
            className="relative inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring sm:h-10 sm:gap-2 sm:px-3 sm:text-sm md:px-4 2xl:h-11 2xl:px-5 2xl:text-base"
            aria-label="Filter by role"
            aria-expanded={filterOpen}
          >
            <Filter className="h-4 w-4 2xl:h-5 2xl:w-5" />
            <span className="hidden sm:inline">Filter</span>
            {roleFilter.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground sm:h-5 sm:w-5 sm:text-xs">
                {roleFilter.length}
              </span>
            )}
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

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm 2xl:rounded-xl">
        <div
          className={cn(
            tableBodyScroll
              ? 'max-h-[min(35.4rem,calc(100dvh-13rem))] overflow-auto'
              : 'overflow-x-auto 2xl:overflow-x-visible',
            isFetching && !isLoading && 'opacity-60',
            'transition-opacity'
          )}
        >
          <table className="w-full min-w-[880px] table-fixed border-collapse text-left text-xs sm:min-w-[1000px] sm:text-sm 2xl:min-w-full 2xl:text-base">
            <thead className="sticky top-0 z-10 bg-muted shadow-[0_1px_0_0_hsl(var(--border))]">
              <tr className="border-b border-border bg-muted">
                <th className="w-10 shrink-0 bg-muted p-2 sm:w-12 sm:p-3 2xl:w-14 2xl:p-4">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-input 2xl:h-5 2xl:w-5"
                    aria-label="Select all"
                  />
                </th>
                {AUDIT_LOG_TABLE_COLUMNS.map(col => (
                  <th
                    key={col.key}
                    className={col.thClassName}
                    aria-sort={ariaSortForAuditColumn(
                      sortKey,
                      sortDir,
                      col.key
                    )}
                  >
                    <div className={col.labelWrapperClassName}>
                      <span
                        className={cn(
                          'select-none',
                          col.key === 'description' && 'min-w-0'
                        )}
                      >
                        {col.label}
                      </span>
                      <AuditLogSortPair
                        columnKey={col.key}
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onApplySort={applySort}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={TABLE_COLUMN_COUNT}
                    className={cn(
                      TABLE_STATUS_CELL_CLASS,
                      'text-muted-foreground'
                    )}
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td
                    colSpan={TABLE_COLUMN_COUNT}
                    className={cn(TABLE_STATUS_CELL_CLASS, 'text-destructive')}
                  >
                    {error instanceof ApiError
                      ? error.message
                      : 'Failed to load audit logs.'}
                  </td>
                </tr>
              )}
              {!isLoading && !isError && (serverRows?.length ?? 0) === 0 && (
                <tr>
                  <td
                    colSpan={TABLE_COLUMN_COUNT}
                    className={cn(
                      TABLE_STATUS_CELL_CLASS,
                      'text-muted-foreground'
                    )}
                  >
                    No records found.
                  </td>
                </tr>
              )}
              {!isLoading &&
                !isError &&
                (serverRows?.length ?? 0) > 0 &&
                sortedRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={TABLE_COLUMN_COUNT}
                      className={cn(
                        TABLE_STATUS_CELL_CLASS,
                        'text-muted-foreground'
                      )}
                    >
                      No rows match this role filter on this page. Try another
                      page or clear roles.
                    </td>
                  </tr>
                )}
              {!isLoading &&
                !isError &&
                sortedRows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-border hover:bg-muted/30"
                  >
                    <td className="w-10 shrink-0 px-2 py-3 sm:w-12 sm:px-3 sm:py-3.5 2xl:w-14 2xl:px-4 2xl:py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(auditLogRowKey(row))}
                        onChange={() => toggleSelect(auditLogRowKey(row))}
                        className="h-4 w-4 rounded border-input 2xl:h-5 2xl:w-5"
                        aria-label={`Select row ${row.id}`}
                      />
                    </td>
                    <td className="w-[130px] whitespace-nowrap px-2 py-3 text-foreground sm:w-[150px] sm:px-3 sm:py-3.5 2xl:px-4 2xl:py-4">
                      {formatAuditLogDateTime(row.date_time)}
                    </td>
                    <td className="w-[200px] px-2 py-3 text-sm sm:w-[220px] sm:px-3 sm:py-3.5 2xl:w-[260px] 2xl:px-4 2xl:py-4">
                      <AuditLogActorCell actor={row.actor} />
                    </td>
                    <td className="w-[160px] px-2 py-3 font-mono text-[11px] text-foreground sm:w-[180px] sm:px-3 sm:py-3.5 sm:text-sm 2xl:w-[200px] 2xl:px-4 2xl:py-4">
                      <span className="block truncate" title={row.action}>
                        {row.action}
                      </span>
                    </td>
                    <td className="w-[100px] px-2 py-3 text-muted-foreground sm:w-[120px] sm:px-3 sm:py-3.5 2xl:px-4 2xl:py-4">
                      <span className="block truncate">{row.target}</span>
                    </td>
                    <td className="px-2 py-3 pl-3 text-muted-foreground sm:px-3 sm:py-3.5 sm:pl-4 2xl:px-4 2xl:py-4 2xl:pl-5">
                      <span
                        className="block truncate"
                        title={row.description || '—'}
                      >
                        {row.description || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3 2xl:px-6 2xl:py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm 2xl:gap-3 2xl:text-base">
            <span className="whitespace-nowrap text-xs sm:text-sm 2xl:text-base">
              Rows per page:
            </span>
            <select
              value={String(perPage)}
              onChange={e => {
                const next = Number(e.target.value)
                setPerPage(next)
                setPage(1)
              }}
              className="h-7 rounded border border-input bg-background pl-2 pr-6 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:h-8 sm:pr-8 sm:text-sm 2xl:h-10 2xl:pl-3 2xl:pr-10 2xl:text-base"
              aria-label="Rows per page"
            >
              {AUDIT_LOG_ROWS_PER_PAGE_OPTIONS.map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground sm:justify-end sm:gap-4 sm:text-sm 2xl:gap-6 2xl:text-base">
            <span className="whitespace-nowrap text-xs sm:text-sm 2xl:text-base">
              {totalItems === 0
                ? '0-0 of 0'
                : roleFilter.length > 0
                  ? `${start}-${end} of ${totalItems} · ${sortedRows.length} match role on this page`
                  : `${start}-${end} of ${totalItems}`}
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1 2xl:gap-2">
              <button
                type="button"
                disabled={activePage <= 1}
                onClick={() => setPage(Math.max(1, activePage - 1))}
                className={PAGINATION_NAV_BTN_CLASS}
                aria-label="Previous page"
              >
                <ChevronLeft className={PAGINATION_ICON_CLASS} />
              </button>
              <button
                type="button"
                disabled={activePage >= totalPages}
                onClick={() => setPage(Math.min(totalPages, activePage + 1))}
                className={PAGINATION_NAV_BTN_CLASS}
                aria-label="Next page"
              >
                <ChevronRight className={PAGINATION_ICON_CLASS} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuditLogRoleFilterPanel
        open={filterOpen}
        anchorRect={filterDropdownRect}
        selectedRoles={roleFilter}
        onToggleRole={toggleRoleFilter}
        onClearRoles={() => {
          setRoleFilter([])
          setPage(1)
        }}
        onClose={closeRoleFilter}
      />
    </div>
  )
}
