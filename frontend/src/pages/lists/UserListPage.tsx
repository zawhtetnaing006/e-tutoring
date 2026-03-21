import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  Filter,
  FileUp,
  Eye,
  Pencil,
  Trash2,
  MoreVertical,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  KeyRound,
  CirclePlus,
} from 'lucide-react'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useUsersList } from '@/features/users/useUsersList'
import { getUserRoleLabel } from '@/features/auth/role-utils'
import {
  getUser,
  updateUser,
  deleteUser,
  type ListUser,
  type UserResource,
} from '@/features/users/api'
import { ViewUserModal } from '@/components/users/ViewUserModal'
import { AddUserModal } from '@/components/users/AddUserModal'
import { EditUserModal } from '@/components/users/EditUserModal'
import { ResetPasswordModal } from '@/components/users/ResetPasswordModal'
import { DeleteUserConfirmation } from '@/components/users/DeleteUserConfirmation'
import type { LayoutVariant } from '@/components/users/types'

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

function formatAddress(u: ListUser): string {
  const parts = [u.country, u.city, u.township].filter(Boolean) as string[]
  if (u.address) parts.unshift(u.address)
  return parts.length > 0 ? parts.join(', ') : '—'
}

function getRoleLabel(
  user:
    | Pick<UserResource, 'role_code' | 'role_name'>
    | Pick<ListUser, 'role_code' | 'role_name'>
    | null
    | undefined
): string {
  return getUserRoleLabel(user)
}

function truncate(str: string, max: number): string {
  if (!str) return ''
  if (str.length <= max) return str
  return str.slice(0, max) + '...'
}

export type { LayoutVariant } from '@/components/users/types'

type UserListPageProps = {
  title: string
  subtitle: string
  userType: 'STAFF' | 'STUDENT' | 'TUTOR'
  addLabel: string
  viewModalTitle?: string
  addModalTitle?: string
  addModalSubtitle?: string
  editModalTitle?: string
  editModalSubtitle?: string
  useStaffLayout?: boolean
  showStaffActions?: boolean
  /** 'staff' | 'tutor' | 'student' – drives modal layouts and dropdown labels */
  layoutVariant?: LayoutVariant
  dropdownActiveLabel?: string
  dropdownInactiveLabel?: string
}

export function UserListPage({
  title,
  subtitle,
  userType,
  addLabel,
  viewModalTitle,
  addModalTitle,
  addModalSubtitle,
  editModalTitle,
  editModalSubtitle,
  useStaffLayout = false,
  showStaffActions = false,
  layoutVariant,
  dropdownActiveLabel = 'Active',
  dropdownInactiveLabel = 'Inactive',
}: UserListPageProps) {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewUuid, setViewUuid] = useState<string | null>(null)
  const [editUuid, setEditUuid] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [openRowUuid, setOpenRowUuid] = useState<string | null>(null)
  const [dropdownRect, setDropdownRect] = useState<{
    top: number
    left: number
    right: number
  } | null>(null)
  const [resetPasswordUuid, setResetPasswordUuid] = useState<string | null>(
    null
  )
  const [deleteTarget, setDeleteTarget] = useState<ListUser | null>(null)

  const queryClient = useQueryClient()
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['users', 'list'] })

  const { data, isLoading, isError } = useUsersList({
    page,
    perPage,
    userType,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      invalidateList()
      setDeleteTarget(null)
      toast.success('User deleted')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete user')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ uuid, is_active }: { uuid: string; is_active: boolean }) =>
      updateUser(uuid, { is_active }),
    onSuccess: () => {
      invalidateList()
      setOpenRowUuid(null)
      setDropdownRect(null)
      toast.success('Status updated')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update status')
    },
  })

  const handleDelete = (row: ListUser) => {
    setDeleteTarget(row)
  }

  const { data: viewUser } = useQuery({
    queryKey: ['users', viewUuid],
    queryFn: () => getUser(viewUuid!),
    enabled: !!viewUuid,
  })

  const { data: editUser } = useQuery({
    queryKey: ['users', editUuid],
    queryFn: () => getUser(editUuid!),
    enabled: !!editUuid,
  })

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
        r.email.toLowerCase().includes(q) ||
        (r.phone ?? '').toLowerCase().includes(q) ||
        formatAddress(r).toLowerCase().includes(q)
    )
  }, [data?.data, search])

  const allSelected =
    filteredRows.length > 0 && filteredRows.every(r => selectedIds.has(r.uuid))
  const someSelected = filteredRows.some(r => selectedIds.has(r.uuid))

  const selectAllRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const el = selectAllRef.current
    if (el) el.indeterminate = someSelected && !allSelected
  }, [someSelected, allSelected])

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredRows.map(r => r.uuid)))
    }
  }

  const toggleSelect = (uuid: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(uuid)) next.delete(uuid)
      else next.add(uuid)
      return next
    })
  }

  return (
    <div className="w-full p-3 sm:p-4 lg:p-2">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-1 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-foreground sm:text-xl lg:text-2xl 2xl:text-3xl">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm lg:text-base 2xl:text-lg">
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:h-10 sm:px-4 sm:text-sm lg:h-9 2xl:px-5 2xl:text-base"
        >
          <CirclePlus className="h-4 w-4 shrink-0 2xl:h-5 2xl:w-5" />
          <span className="whitespace-nowrap">{addLabel}</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-6 sm:justify-end sm:gap-3 2xl:mb-8 2xl:gap-4">
        <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[140px] sm:max-w-[240px] sm:flex-1 2xl:max-w-[320px]">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground sm:left-3 2xl:h-5 2xl:w-5"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:h-10 sm:pl-10 sm:pr-4 sm:text-sm 2xl:h-11 2xl:pl-11 2xl:text-base"
          />
        </div>
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

      {/* Table card */}
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
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-input 2xl:h-5 2xl:w-5"
                    aria-label="Select all"
                  />
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[15%] 2xl:p-4">
                  <span className="inline-flex items-center gap-1 2xl:gap-2">
                    Name
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground 2xl:h-5 2xl:w-5" />
                  </span>
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[12%] 2xl:p-4">
                  Role
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[20%] 2xl:p-4">
                  <span className="inline-flex items-center gap-1 2xl:gap-2">
                    Email
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground 2xl:h-5 2xl:w-5" />
                  </span>
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[13%] 2xl:p-4">
                  <span className="inline-flex items-center gap-1 2xl:gap-2">
                    Phone
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground 2xl:h-5 2xl:w-5" />
                  </span>
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[20%] 2xl:p-4">
                  <span className="inline-flex items-center gap-1 2xl:gap-2">
                    Address
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground 2xl:h-5 2xl:w-5" />
                  </span>
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[10%] 2xl:p-4">
                  <span className="inline-flex items-center gap-1 2xl:gap-2">
                    Status
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground 2xl:h-5 2xl:w-5" />
                  </span>
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[10%] 2xl:p-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6 text-center text-muted-foreground sm:p-8 2xl:p-12 2xl:text-lg"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6 text-center text-destructive sm:p-8 2xl:p-12 2xl:text-lg"
                  >
                    Failed to load data.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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
                    key={row.uuid}
                    className="border-b border-border hover:bg-muted/30 2xl:h-16"
                  >
                    <td className="w-10 shrink-0 p-2 sm:w-12 sm:p-3 2xl:w-14 2xl:p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.uuid)}
                        onChange={() => toggleSelect(row.uuid)}
                        className="h-4 w-4 rounded border-input 2xl:h-5 2xl:w-5"
                        aria-label={`Select ${row.name}`}
                      />
                    </td>
                    <td className="min-w-[120px] p-2 font-medium text-foreground sm:p-3 2xl:min-w-[160px] 2xl:p-4">
                      <span className="break-words">{row.name}</span>
                    </td>
                    <td className="whitespace-nowrap p-2 text-muted-foreground sm:p-3 2xl:p-4">
                      {truncate(getRoleLabel(row), 18)}
                    </td>
                    <td className="min-w-[140px] p-2 text-muted-foreground sm:p-3 2xl:p-4">
                      <span
                        className="block max-w-[180px] truncate 2xl:max-w-none"
                        title={row.email}
                      >
                        {row.email}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-2 text-muted-foreground sm:p-3 2xl:p-4">
                      {row.phone ?? '—'}
                    </td>
                    <td className="min-w-[120px] max-w-[180px] p-2 text-muted-foreground sm:p-3 2xl:max-w-none 2xl:p-4">
                      <span
                        className="block truncate 2xl:whitespace-normal 2xl:break-words"
                        title={formatAddress(row)}
                      >
                        {formatAddress(row)}
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
                          onClick={() => setViewUuid(row.uuid)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground 2xl:p-2"
                          aria-label={`View ${row.name}`}
                        >
                          <Eye className="h-4 w-4 2xl:h-5 2xl:w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditUuid(row.uuid)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground 2xl:p-2"
                          aria-label={`Edit ${row.name}`}
                        >
                          <Pencil className="h-4 w-4 2xl:h-5 2xl:w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          disabled={deleteMutation.isPending}
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
                                if (openRowUuid === row.uuid) {
                                  setOpenRowUuid(null)
                                  setDropdownRect(null)
                                } else {
                                  setOpenRowUuid(row.uuid)
                                  setDropdownRect({
                                    top: rect.bottom,
                                    left: rect.left,
                                    right: rect.right,
                                  })
                                }
                              }}
                              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground 2xl:p-2"
                              aria-label="More options"
                              aria-expanded={openRowUuid === row.uuid}
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

        {/* Pagination */}
        <div className="flex flex-col gap-2 border-t border-border px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3 2xl:px-6 2xl:py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm 2xl:gap-3 2xl:text-base">
            <span className="whitespace-nowrap text-xs sm:text-sm 2xl:text-base">
              Rows per page:
            </span>
            <select
              value={perPage}
              onChange={e => {
                setPerPage(Number(e.target.value))
                setPage(1)
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
              {totalItems === 0
                ? '0-0 of 0'
                : `${start}-${end} of ${totalItems}`}
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1 2xl:gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:p-2 2xl:p-2.5"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:p-2 2xl:p-2.5"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 2xl:h-5 2xl:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Staff actions dropdown (portal so it is not clipped by table overflow) */}
      {showStaffActions &&
        openRowUuid &&
        dropdownRect &&
        (() => {
          const row = filteredRows.find(r => r.uuid === openRowUuid)
          if (!row) return null
          const menuWidth = 180
          return createPortal(
            <>
              <div
                className="fixed inset-0 z-[100]"
                aria-hidden
                onClick={() => {
                  setOpenRowUuid(null)
                  setDropdownRect(null)
                }}
              />
              <div
                className="fixed z-[101] min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg 2xl:min-w-[220px] 2xl:rounded-xl"
                style={{
                  top: dropdownRect.top + 4,
                  left: Math.max(8, dropdownRect.right - menuWidth),
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    updateStatusMutation.mutate({
                      uuid: row.uuid,
                      is_active: true,
                    })
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-green-600 hover:bg-muted dark:text-green-400 2xl:gap-3 2xl:px-4 2xl:py-3 2xl:text-base"
                >
                  <UserCheck className="h-4 w-4 shrink-0 2xl:h-5 2xl:w-5" />
                  {dropdownActiveLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateStatusMutation.mutate({
                      uuid: row.uuid,
                      is_active: false,
                    })
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-muted dark:text-red-400 2xl:gap-3 2xl:px-4 2xl:py-3 2xl:text-base"
                >
                  <UserX className="h-4 w-4 shrink-0 2xl:h-5 2xl:w-5" />
                  {dropdownInactiveLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenRowUuid(null)
                    setDropdownRect(null)
                    setResetPasswordUuid(row.uuid)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted 2xl:gap-3 2xl:px-4 2xl:py-3 2xl:text-base"
                >
                  <KeyRound className="h-4 w-4 shrink-0 2xl:h-5 2xl:w-5" />
                  Reset Password
                </button>
              </div>
            </>,
            document.body
          )
        })()}

      {/* View modal */}
      {viewUuid && (
        <ViewUserModal
          user={viewUser ?? null}
          loading={!!viewUuid && viewUser === undefined}
          onClose={() => setViewUuid(null)}
          title={viewModalTitle}
          variant={
            layoutVariant === 'staff'
              ? 'staff'
              : layoutVariant === 'tutor'
                ? 'tutor'
                : layoutVariant === 'student'
                  ? 'student'
                  : useStaffLayout
                    ? 'staff'
                    : 'default'
          }
          assignedTutorName={undefined}
          semesterPeriod={undefined}
        />
      )}

      {/* Add modal */}
      {addOpen && (
        <AddUserModal
          userType={userType}
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            invalidateList()
            setAddOpen(false)
            toast.success('User created')
          }}
          onError={msg => toast.error(msg)}
          title={addModalTitle}
          subtitle={addModalSubtitle}
          useStaffLayout={useStaffLayout}
          layoutVariant={layoutVariant}
        />
      )}

      {/* Edit modal */}
      {editUuid && editUser && (
        <EditUserModal
          key={editUuid}
          user={editUser}
          onClose={() => setEditUuid(null)}
          onSuccess={() => {
            invalidateList()
            setEditUuid(null)
            toast.success('User updated')
          }}
          onError={msg => toast.error(msg)}
          title={editModalTitle}
          subtitle={editModalSubtitle}
          useStaffLayout={useStaffLayout}
          layoutVariant={layoutVariant}
        />
      )}

      {/* Reset password modal */}
      {resetPasswordUuid &&
        (() => {
          const target = filteredRows.find(r => r.uuid === resetPasswordUuid)
          return target ? (
            <ResetPasswordModal
              key={resetPasswordUuid}
              userUuid={resetPasswordUuid}
              userName={target.name}
              onClose={() => setResetPasswordUuid(null)}
              onSuccess={() => {
                setResetPasswordUuid(null)
                toast.success('Password updated')
              }}
              onError={msg => toast.error(msg)}
            />
          ) : null
        })()}

      {deleteTarget && (
        <DeleteUserConfirmation
          userName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget.uuid)}
          isPending={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
