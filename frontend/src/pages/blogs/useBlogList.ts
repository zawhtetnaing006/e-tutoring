import { useEffect, useMemo, useState } from 'react'
import { useBlogs } from '@/features/blogs/useBlogs'
import { useDebouncedValue } from '@/hooks'
import type { StatusFilter } from '@/components/blogs'

export const BLOGS_PAGE_SIZE = 9

export function useBlogList(canManageBlogs: boolean) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    canManageBlogs ? 'all' : 'active'
  )

  const debouncedSearch = useDebouncedValue(search.trim(), 350)

  useEffect(() => {
    if (!canManageBlogs && statusFilter !== 'active') {
      setStatusFilter('active')
      setPage(1)
    }
    // Only run when canManageBlogs changes, not when statusFilter changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManageBlogs])

  const query = useBlogs({
    page,
    perPage: BLOGS_PAGE_SIZE,
    search: debouncedSearch,
    isActive: canManageBlogs
      ? statusFilter === 'all'
        ? undefined
        : statusFilter === 'active'
      : true,
  })

  const blogs = useMemo(() => query.data?.data ?? [], [query.data?.data])
  const totalPages = query.data?.total_page ?? 1
  const totalItems = query.data?.total_items ?? 0

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusFilterChange = (value: StatusFilter) => {
    if (!canManageBlogs) {
      return
    }
    setStatusFilter(value)
    setPage(1)
  }

  return {
    blogs,
    isLoading: query.isLoading,
    page,
    setPage,
    search,
    statusFilter,
    totalPages,
    totalItems,
    handleSearchChange,
    handleStatusFilterChange,
  }
}
