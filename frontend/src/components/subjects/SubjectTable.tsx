import type { RefObject } from 'react'
import {
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { LoadingSpinner, SortColumnChevrons } from '@/components/ui'
import { ROWS_PER_PAGE_OPTIONS } from '@/utils/constants'
import type { Subject } from '@/features/subjects/api'

export type SubjectSortColumn = 'name' | 'description' | 'status'

export interface SubjectTableProps {
  filteredRows: Subject[]
  isLoading: boolean
  isError: boolean
  selectedIds: Set<number>
  allSelected: boolean
  selectAllRef: RefObject<HTMLInputElement | null>
  onToggleSelectAll: () => void
  onToggleSelect: (id: number) => void
  onView: (row: Subject) => void
  onEdit: (row: Subject) => void
  onDelete: (row: Subject) => void
  onToggleRowMenu: (row: Subject, rect: DOMRect) => void
  openRowId: number | null
  showStaffActions: boolean
  deletePending: boolean
  page: number
  perPage: number
  totalItems: number
  totalPages: number
  start: number
  end: number
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
  sortKey: SubjectSortColumn | null
  sortDir: 'asc' | 'desc'
  onSort: (key: SubjectSortColumn) => void
}

export function SubjectTable({
  filteredRows,
  isLoading,
  isError,
  selectedIds,
  allSelected,
  selectAllRef,
  onToggleSelectAll,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onToggleRowMenu,
  openRowId,
  showStaffActions,
  deletePending,
  page,
  perPage,
  totalItems,
  totalPages,
  start,
  end,
  onPageChange,
  onPerPageChange,
  sortKey,
  sortDir,
  onSort,
}: SubjectTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm 2xl:rounded-xl">
      <div className="overflow-x-auto 2xl:overflow-x-visible">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:min-w-[800px] sm:text-sm 2xl:min-w-full 2xl:table-fixed 2xl:text-base">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-10 shrink-0 p-2 sm:w-12 sm:p-3 2xl:w-14 2xl:p-4">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-input 2xl:h-5 2xl:w-5"
                  aria-label="Select all"
                />
              </th>
              <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[25%] 2xl:p-4">
                <button
                  type="button"
                  onClick={() => onSort('name')}
                  className="inline-flex w-full items-center gap-1 2xl:gap-2"
                >
                  Name
                  <SortColumnChevrons
                    active={sortKey === 'name'}
                    direction={sortDir}
                  />
                </button>
              </th>
              <th className="w-2/3 whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[45%] 2xl:p-4">
                <button
                  type="button"
                  onClick={() => onSort('description')}
                  className="inline-flex w-full items-center gap-1 2xl:gap-2"
                >
                  Description
                  <SortColumnChevrons
                    active={sortKey === 'description'}
                    direction={sortDir}
                  />
                </button>
              </th>
              <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[12%] 2xl:p-4">
                <button
                  type="button"
                  onClick={() => onSort('status')}
                  className="inline-flex w-full items-center gap-1 2xl:gap-2"
                >
                  Status
                  <SortColumnChevrons
                    active={sortKey === 'status'}
                    direction={sortDir}
                  />
                </button>
              </th>
              <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[18%] 2xl:p-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-muted-foreground sm:p-8 2xl:p-12 2xl:text-lg"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <LoadingSpinner className="text-muted-foreground" />
                    Loading...
                  </span>
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-destructive sm:p-8 2xl:p-12 2xl:text-lg"
                >
                  Failed to load data.
                </td>
              </tr>
            )}
            {!isLoading && !isError && filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-muted-foreground sm:p-8 2xl:p-12 2xl:text-lg"
                >
                  No records found.
                </td>
              </tr>
            )}
            {!isLoading &&
              !isError &&
              filteredRows.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-border hover:bg-muted/30 2xl:h-16"
                >
                  <td className="w-10 shrink-0 p-2 sm:w-12 sm:p-3 2xl:w-14 2xl:p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => onToggleSelect(row.id)}
                      className="h-4 w-4 rounded border-input 2xl:h-5 2xl:w-5"
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                  <td className="min-w-[240px] p-2 font-medium text-foreground sm:p-3 2xl:p-4">
                    <span className="break-words">{row.name}</span>
                  </td>
                  <td className="w-2/3 max-w-0 p-2 text-muted-foreground sm:p-3 2xl:max-w-none 2xl:p-4">
                    <span
                      className="block truncate 2xl:line-clamp-2 2xl:whitespace-normal 2xl:break-words"
                      title={row.description || '—'}
                    >
                      {row.description || '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap p-2 sm:p-3 2xl:p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium sm:px-2.5 2xl:px-3 2xl:py-1 2xl:text-sm ${
                        row.is_active
                          ? 'bg-success/15 text-success'
                          : 'bg-destructive/15 text-destructive'
                      }`}
                    >
                      {row.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="w-[1%] whitespace-nowrap p-2 sm:p-3 2xl:p-4">
                    <div className="flex items-center justify-end gap-0.5 sm:gap-1 2xl:gap-2">
                      <button
                        type="button"
                        onClick={() => onView(row)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground 2xl:p-2"
                        aria-label={`View ${row.name}`}
                      >
                        <Eye className="h-4 w-4 2xl:h-5 2xl:w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground 2xl:p-2"
                        aria-label={`Edit ${row.name}`}
                      >
                        <Pencil className="h-4 w-4 2xl:h-5 2xl:w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        disabled={deletePending}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50 2xl:p-2"
                        aria-label={`Delete ${row.name}`}
                      >
                        <Trash2 className="h-4 w-4 2xl:h-5 2xl:w-5" />
                      </button>
                      {showStaffActions ? (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={e => {
                              const rect =
                                e.currentTarget.getBoundingClientRect()
                              onToggleRowMenu(row, rect)
                            }}
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground 2xl:p-2"
                            aria-label="More options"
                            aria-expanded={openRowId === row.id}
                          >
                            <MoreVertical className="h-4 w-4 2xl:h-5 2xl:w-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground 2xl:p-2"
                          aria-label="More options"
                        >
                          <MoreVertical className="h-4 w-4 2xl:h-5 2xl:w-5" />
                        </button>
                      )}
                    </div>
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
            value={perPage}
            onChange={e => {
              onPerPageChange(Number(e.target.value))
            }}
            className="h-7 rounded border border-input bg-background pl-2 pr-6 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:h-8 sm:pr-8 sm:text-sm 2xl:h-10 2xl:pl-3 2xl:pr-10 2xl:text-base"
            aria-label="Rows per page"
          >
            {ROWS_PER_PAGE_OPTIONS.map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground sm:justify-end sm:gap-4 sm:text-sm 2xl:gap-6 2xl:text-base">
          <span className="whitespace-nowrap text-xs sm:text-sm 2xl:text-base">
            {totalItems === 0 ? '0-0 of 0' : `${start}-${end} of ${totalItems}`}
          </span>
          <div className="flex items-center gap-0.5 sm:gap-1 2xl:gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:p-2 2xl:p-2.5"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:p-2 2xl:p-2.5"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
