import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Eye,
  LoaderCircle,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/features/auth'
import {
  deleteAllocation,
  deleteAllocations,
  type Allocation,
} from '@/features/allocations/api'
import { useAllocations } from '@/features/allocations/useAllocations'
import { useUsers } from '@/features/users/useUsers'
import { useDebouncedValue } from '@/hooks'
import { CreateAllocationModal } from './components/CreateAllocationModal'
import { AllocationDetailsModal } from './components/AllocationDetailsModal'

type AllocationRow = Allocation & {
  tutorName: string
  studentName: string
}

function formatDate(value: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-CA')
}

function findUserName(
  users: User[] | undefined,
  userId: number,
  fallback: string
) {
  return users?.find(user => user.id === userId)?.name ?? fallback
}

export function AllocationsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingAllocation, setEditingAllocation] = useState<Allocation | null>(
    null
  )
  const [selectedAllocationId, setSelectedAllocationId] = useState<
    number | null
  >(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const debouncedSearch = useDebouncedValue(search.trim(), 400)

  const allocationsQuery = useAllocations({
    page,
    perPage: 10,
    search: debouncedSearch,
  })
  const tutorsQuery = useUsers({ perPage: 100, role_code: 'TUTOR' })
  const studentsQuery = useUsers({ perPage: 100, role_code: 'STUDENT' })

  const users = useMemo(
    () => [
      ...(tutorsQuery.data?.data ?? []),
      ...(studentsQuery.data?.data ?? []),
    ],
    [studentsQuery.data?.data, tutorsQuery.data?.data]
  )

  const rows = useMemo<AllocationRow[]>(() => {
    return (allocationsQuery.data?.data ?? []).map(allocation => ({
      ...allocation,
      tutorName: findUserName(
        tutorsQuery.data?.data,
        allocation.tutor_user_id,
        `Tutor #${allocation.tutor_user_id}`
      ),
      studentName: findUserName(
        studentsQuery.data?.data,
        allocation.student_user_id,
        `Student #${allocation.student_user_id}`
      ),
    }))
  }, [
    allocationsQuery.data?.data,
    studentsQuery.data?.data,
    tutorsQuery.data?.data,
  ])

  const currentPageIds = useMemo(() => rows.map(row => row.id), [rows])
  const visibleSelectedIds = useMemo(
    () => selectedIds.filter(id => currentPageIds.includes(id)),
    [currentPageIds, selectedIds]
  )
  const allCurrentPageSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every(id => visibleSelectedIds.includes(id))
  const totalPages = allocationsQuery.data?.total_page ?? 1

  const deleteMutation = useMutation({
    mutationFn: deleteAllocation,
    onSuccess: () => {
      toast.success('Allocation deleted', {
        description: 'The allocation has been removed successfully.',
      })
      void queryClient.invalidateQueries({ queryKey: ['allocations'] })
      setSelectedIds(current =>
        current.filter(id => !currentPageIds.includes(id))
      )
    },
    onError: error => {
      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to delete allocation', { description })
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteAllocations,
    onSuccess: (_, ids) => {
      toast.success('Allocations deleted', {
        description: `${ids.length} allocation(s) have been removed successfully.`,
      })
      setSelectedIds(current => current.filter(id => !ids.includes(id)))
      void queryClient.invalidateQueries({ queryKey: ['allocations'] })
    },
    onError: error => {
      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to delete allocations', { description })
    },
  })

  const handleDelete = (allocation: Allocation) => {
    const confirmed = window.confirm(
      `Delete the allocation for student #${allocation.student_user_id}?`
    )

    if (!confirmed) return

    deleteMutation.mutate(allocation.id)
  }

  const handleBulkDelete = () => {
    if (visibleSelectedIds.length === 0) return

    const confirmed = window.confirm(
      `Delete ${visibleSelectedIds.length} selected allocation(s)?`
    )

    if (!confirmed) return

    bulkDeleteMutation.mutate(visibleSelectedIds)
  }

  const handleToggleRow = (id: number) => {
    setSelectedIds(current =>
      current.includes(id)
        ? current.filter(currentId => currentId !== id)
        : [...current, id]
    )
  }

  const handleToggleSelectAll = () => {
    setSelectedIds(current =>
      allCurrentPageSelected
        ? current.filter(id => !currentPageIds.includes(id))
        : [...new Set([...current, ...currentPageIds])]
    )
  }

  return (
    <>
      <div className="w-full space-y-6">
        <section className="p-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Allocation &amp; Scheduling
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign tutors to students
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {visibleSelectedIds.length > 0 ? (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                  Delete Selected ({visibleSelectedIds.length})
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Plus className="size-4" />
                Allocation Student
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <div className="relative w-full md:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={event => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Search..."
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <Upload className="size-4" />
              Excel
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-background">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-muted-foreground">
                    <th className="w-12 px-4 py-3 font-medium">
                      <input
                        type="checkbox"
                        checked={allCurrentPageSelected}
                        onChange={handleToggleSelectAll}
                        aria-label="Select all allocations on this page"
                        className="size-4"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Tutor</th>
                    <th className="px-4 py-3 font-medium">Semester Period</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border bg-background">
                  {allocationsQuery.isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        <span className="inline-flex items-center gap-2">
                          <LoaderCircle className="size-4 animate-spin" />
                          Loading allocations...
                        </span>
                      </td>
                    </tr>
                  ) : rows.length > 0 ? (
                    rows.map(row => (
                      <tr key={row.id} className="hover:bg-muted/20">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={visibleSelectedIds.includes(row.id)}
                            onChange={() => handleToggleRow(row.id)}
                            aria-label={`Select allocation ${row.id}`}
                            className="size-4"
                          />
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {row.studentName}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {row.tutorName}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {formatDate(row.from_date)} -{' '}
                          {formatDate(row.to_date)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedAllocationId(row.id)}
                              className="rounded-md p-2 text-slate-600 hover:bg-muted"
                              aria-label={`View allocation ${row.id}`}
                            >
                              <Eye className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAllocation(row)}
                              className="rounded-md p-2 text-blue-500 hover:bg-muted"
                              aria-label={`Edit allocation ${row.id}`}
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(row)}
                              disabled={deleteMutation.isPending}
                              className="rounded-md p-2 text-red-500 hover:bg-muted disabled:opacity-50"
                              aria-label={`Delete allocation ${row.id}`}
                            >
                              <Trash2 className="size-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-md p-2 text-slate-500 hover:bg-muted"
                              aria-label={`More actions for allocation ${row.id}`}
                            >
                              <MoreVertical className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No allocations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>Rows per page: 10</p>

            <div className="flex items-center gap-3">
              <span>
                {allocationsQuery.data?.total_items ?? 0} total allocation(s)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(current => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-border px-2 py-1 disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage(current => Math.min(totalPages, current + 1))
                  }
                  disabled={page >= totalPages}
                  className="rounded-md border border-border px-2 py-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isCreateOpen ? (
        <CreateAllocationModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          tutors={tutorsQuery.data?.data ?? []}
          students={studentsQuery.data?.data ?? []}
        />
      ) : null}

      {editingAllocation ? (
        <CreateAllocationModal
          isOpen
          onClose={() => setEditingAllocation(null)}
          mode="edit"
          allocation={editingAllocation}
          tutors={tutorsQuery.data?.data ?? []}
          students={studentsQuery.data?.data ?? []}
        />
      ) : null}

      <AllocationDetailsModal
        allocationId={selectedAllocationId}
        onClose={() => setSelectedAllocationId(null)}
        users={users}
      />
    </>
  )
}
