import { useState, useMemo, useRef, useEffect } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSubjects } from '@/features/subjects/useSubjects'
import {
  deleteSubject,
  toggleSubjectStatus,
  type Subject,
} from '@/features/subjects/api'
import { QUERY_KEYS } from '@/utils/constants'

type SubjectSortKey = 'name' | 'description' | 'status'
type SortDir = 'asc' | 'desc'
export type SubjectStatusFilter = 'all' | 'active' | 'inactive'

function compareSubjects(
  a: Subject,
  b: Subject,
  key: SubjectSortKey,
  dir: SortDir
): number {
  let cmp = 0
  switch (key) {
    case 'name':
      cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      break
    case 'description':
      cmp = (a.description ?? '').localeCompare(
        b.description ?? '',
        undefined,
        {
          sensitivity: 'base',
        }
      )
      break
    case 'status':
      cmp = Number(a.is_active) - Number(b.is_active)
      break
    default:
      cmp = 0
  }
  return dir === 'asc' ? cmp : -cmp
}

export function useSubjectListPage(showStaffActions: boolean) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [viewSubject, setViewSubject] = useState<Subject | null>(null)
  const [editSubject, setEditSubject] = useState<Subject | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [openRowId, setOpenRowId] = useState<number | null>(null)
  const [dropdownRect, setDropdownRect] = useState<{
    top: number
    left: number
    right: number
  } | null>(null)
  const [sortKey, setSortKey] = useState<SubjectSortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [statusFilter, setStatusFilter] = useState<SubjectStatusFilter>('all')

  const queryClient = useQueryClient()
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SUBJECTS] })

  const { data, isLoading, isError } = useSubjects({
    page,
    per_page: perPage,
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      toggleSubjectStatus(id, isActive),
    onSuccess: () => {
      invalidateList()
      toast.success('Subject status updated')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update subject status')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      invalidateList()
      toast.success('Subject deleted')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete subject')
    },
  })

  const handleDelete = (row: Subject) => {
    if (!window.confirm(`Delete "${row.name}"? This cannot be undone.`)) return
    deleteMutation.mutate(row.id)
  }

  const totalItems = data?.total_items ?? 0
  const totalPages = data?.total_page ?? 1
  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, totalItems)

  const handleSort = (key: SubjectSortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filteredRows = useMemo(() => {
    let rows = data?.data ?? []
    if (statusFilter === 'active') {
      rows = rows.filter(r => r.is_active)
    } else if (statusFilter === 'inactive') {
      rows = rows.filter(r => !r.is_active)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      rows = rows.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          (r.description ?? '').toLowerCase().includes(q)
      )
    }
    if (sortKey) {
      rows = [...rows].sort((a, b) => compareSubjects(a, b, sortKey, sortDir))
    }
    return rows
  }, [data?.data, search, statusFilter, sortKey, sortDir])

  const allSelected =
    filteredRows.length > 0 && filteredRows.every(r => selectedIds.has(r.id))
  const someSelected = filteredRows.some(r => selectedIds.has(r.id))

  const selectAllRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = selectAllRef.current
    if (el) el.indeterminate = someSelected && !allSelected
  }, [someSelected, allSelected])

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRows.map(r => r.id)))
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleRowMenu = (row: Subject, rect: DOMRect) => {
    if (openRowId === row.id) {
      setOpenRowId(null)
      setDropdownRect(null)
    } else {
      setOpenRowId(row.id)
      setDropdownRect({
        top: rect.bottom,
        left: rect.left,
        right: rect.right,
      })
    }
  }

  const closeStaffMenu = () => {
    setOpenRowId(null)
    setDropdownRect(null)
  }

  const staffRow = useMemo(
    () =>
      showStaffActions && openRowId
        ? filteredRows.find(r => r.id === openRowId)
        : undefined,
    [showStaffActions, openRowId, filteredRows]
  )

  return {
    page,
    setPage,
    perPage,
    setPerPage,
    search,
    setSearch,
    selectedIds,
    viewSubject,
    setViewSubject,
    editSubject,
    setEditSubject,
    addOpen,
    setAddOpen,
    openRowId,
    dropdownRect,
    invalidateList,
    isLoading,
    isError,
    toggleStatusMutation,
    deleteMutation,
    handleDelete,
    totalItems,
    totalPages,
    start,
    end,
    filteredRows,
    allSelected,
    selectAllRef,
    toggleSelectAll,
    toggleSelect,
    handleToggleRowMenu,
    closeStaffMenu,
    staffRow,
    sortKey,
    sortDir,
    handleSort,
    statusFilter,
    setStatusFilter,
  }
}
