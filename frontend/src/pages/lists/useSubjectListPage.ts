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

  const filteredRows = useMemo(() => {
    const rows = data?.data ?? []
    if (!search.trim()) return rows
    const q = search.toLowerCase().trim()
    return rows.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q)
    )
  }, [data?.data, search])

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
  }
}
