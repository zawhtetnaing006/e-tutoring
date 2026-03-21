import type { ReactNode } from 'react'
import { ChevronsUpDown } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (item: T) => ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string | number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string) => void
  emptyMessage?: string
  loading?: boolean
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  sortBy,
  onSort,
  emptyMessage = 'No data available',
  loading = false,
  className = '',
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-12">
        <div className="text-gray-500">{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                className={`px-6 py-3 text-${column.align || 'left'} text-xs font-medium uppercase tracking-wider text-gray-500`}
                style={{ width: column.width }}
              >
                {column.sortable ? (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="group inline-flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>{column.header}</span>
                    <ChevronsUpDown
                      className={`h-4 w-4 ${
                        sortBy === column.key
                          ? 'text-gray-700'
                          : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />
                  </button>
                ) : (
                  <span>{column.header}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map(item => (
            <tr key={keyExtractor(item)} className="hover:bg-gray-50">
              {columns.map(column => (
                <td
                  key={column.key}
                  className={`whitespace-nowrap px-6 py-4 text-sm text-gray-900 text-${column.align || 'left'}`}
                >
                  {column.render
                    ? column.render(item)
                    : String(
                        (item as Record<string, unknown>)[column.key] ?? '—'
                      )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
