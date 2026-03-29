import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ResponsiveTableColumn<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
}

type ResponsiveTableProps<T> = {
  columns: ResponsiveTableColumn<T>[]
  rows: T[]
  emptyMessage: string
  getRowKey: (row: T, index: number) => string | number
  /** Applied to `<table>` — set `min-w-[…]` so the table keeps a desktop-like width and scrolls horizontally on narrow viewports. */
  tableClassName?: string
}

/**
 * Renders a standard data table at all breakpoints. On narrow screens the same
 * layout is preserved inside a horizontally scrollable region.
 */
export function ResponsiveTable<T>({
  columns,
  rows,
  emptyMessage,
  getRowKey,
  tableClassName = 'w-full',
}: ResponsiveTableProps<T>) {
  const isEmpty = rows.length === 0

  return (
    <div
      className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      role="region"
      aria-label="Data table"
    >
      <table className={cn('border-collapse text-sm', tableClassName)}>
        <thead>
          <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-700">
            {columns.map(col => (
              <th
                key={col.id}
                className="whitespace-nowrap pb-3 pr-4 last:pr-0"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-4 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className="border-b border-gray-100 text-gray-700"
              >
                {columns.map(col => (
                  <td
                    key={col.id}
                    className="whitespace-nowrap py-3 pr-4 align-top last:pr-0"
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
