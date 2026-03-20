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
  X,
  CirclePlus,
  UserCheck,
  UserX,
} from 'lucide-react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSubjects } from '@/features/subjects/useSubjects'
import {
  createSubject,
  updateSubject,
  deleteSubject,
  toggleSubjectStatus,
  type Subject,
  type CreateSubjectPayload,
  type UpdateSubjectPayload,
} from '@/features/subjects/api'

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d
      .toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '-')
  } catch {
    return iso
  }
}

function ViewSubjectModal({
  subject,
  onClose,
  title = 'Detail Subject',
}: {
  subject: Subject | null
  loading: boolean
  onClose: () => void
  title?: string
}) {
  return (
    <div className="fixed inset-0 z-modal !mt-0 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
      <div className="my-auto flex w-full max-w-[calc(100vw-1.5rem)] flex-col rounded-xl border border-border bg-card shadow-lg sm:max-w-lg">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 sm:px-6">
          <h2 className="truncate pr-2 text-lg font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-4 sm:p-6">
          {!subject && (
            <p className="py-8 text-center text-muted-foreground">
              No subject data
            </p>
          )}
          {subject && (
            <div className="space-y-6 text-sm">
              <section>
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground">
                    {subject.name}
                  </dd>
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="text-foreground">
                    {subject.description || '—'}
                  </dd>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="text-foreground">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium sm:px-2.5 ${
                        subject.is_active
                          ? 'bg-success/15 text-success'
                          : 'bg-destructive/15 text-destructive'
                      }`}
                    >
                      {subject.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                  <dt className="text-muted-foreground">Created At</dt>
                  <dd className="text-foreground">
                    {formatDateTime(subject.created_at)}
                  </dd>
                  <dt className="text-muted-foreground">Updated At</dt>
                  <dd className="text-foreground">
                    {formatDateTime(subject.updated_at)}
                  </dd>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AddSubjectModal({
  onClose,
  onSuccess,
  title = 'Create New Subject',
  subtitle = 'Fill in the details below to add a new subject...',
}: {
  onClose: () => void
  onSuccess: () => void
  title?: string
  subtitle?: string
}) {
  const [form, setForm] = useState<CreateSubjectPayload>({
    name: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Subject name is required')
      return
    }
    setSubmitting(true)
    try {
      await createSubject({
        name: form.name,
        description: form.description || null,
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create subject'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-modal !mt-0 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
      <div className="my-auto flex w-full max-w-[calc(100vw-1.5rem)] flex-col rounded-xl border border-border bg-card shadow-lg sm:max-w-lg">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {title}
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="max-h-[calc(100vh-12rem)] space-y-4 overflow-y-auto p-4 sm:p-6">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Subject Name <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. Advanced Mathematics"
                value={form.name}
                onChange={e =>
                  setForm(prev => ({ ...prev, name: e.target.value }))
                }
                required
                maxLength={255}
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="description"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="e.g. Brief description of the subject"
                value={form.description || ''}
                onChange={e =>
                  setForm(prev => ({ ...prev, description: e.target.value }))
                }
                maxLength={1000}
                rows={4}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditSubjectModal({
  subject,
  onClose,
  onSuccess,
  title = 'Edit Subject',
  subtitle = 'Fill in the details below to edit a subject...',
}: {
  subject: Subject
  onClose: () => void
  onSuccess: () => void
  title?: string
  subtitle?: string
}) {
  const [form, setForm] = useState<UpdateSubjectPayload>({
    name: subject.name,
    description: subject.description || '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Subject name is required')
      return
    }
    setSubmitting(true)
    try {
      await updateSubject(subject.id, {
        name: form.name,
        description: form.description || null,
      })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update subject'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-modal !mt-0 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
      <div className="my-auto flex w-full max-w-[calc(100vw-1.5rem)] flex-col rounded-xl border border-border bg-card shadow-lg sm:max-w-lg">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {title}
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="max-h-[calc(100vh-12rem)] space-y-4 overflow-y-auto p-4 sm:p-6">
            <div>
              <label
                htmlFor="edit-name"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Subject Name <span className="text-destructive">*</span>
              </label>
              <input
                id="edit-name"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Advanced Mathematics"
                value={form.name}
                onChange={e =>
                  setForm(prev => ({ ...prev, name: e.target.value }))
                }
                required
                maxLength={255}
              />
            </div>
            <div>
              <label
                htmlFor="edit-description"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="edit-description"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Study of software development methodologies, system d..."
                value={form.description || ''}
                onChange={e =>
                  setForm(prev => ({ ...prev, description: e.target.value }))
                }
                maxLength={1000}
                rows={4}
              />
            </div>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export type SubjectListPageProps = {
  title: string
  subtitle: string
  addLabel: string
  viewModalTitle: string
  addModalTitle: string
  addModalSubtitle: string
  editModalTitle: string
  editModalSubtitle: string
  showStaffActions?: boolean
  dropdownActiveLabel?: string
  dropdownInactiveLabel?: string
}

export function SubjectListPage({
  title,
  subtitle,
  addLabel,
  viewModalTitle,
  addModalTitle,
  addModalSubtitle,
  editModalTitle,
  editModalSubtitle,
  showStaffActions = false,
}: SubjectListPageProps) {
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
    queryClient.invalidateQueries({ queryKey: ['subjects'] })

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
          className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 sm:h-10 sm:px-4 sm:text-sm xl:h-9 2xl:px-5 2xl:text-base"
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
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[25%] 2xl:p-4">
                  <span className="inline-flex items-center gap-1 2xl:gap-2">
                    Name
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground 2xl:h-5 2xl:w-5" />
                  </span>
                </th>
                <th className="w-2/3 whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[45%] 2xl:p-4">
                  Description
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3 2xl:w-[12%] 2xl:p-4">
                  <span className="inline-flex items-center gap-1 2xl:gap-2">
                    Status
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground 2xl:h-5 2xl:w-5" />
                  </span>
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
                    Loading...
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
                        onChange={() => toggleSelect(row.id)}
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
                          onClick={() => setViewSubject(row)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground 2xl:p-2"
                          aria-label={`View ${row.name}`}
                        >
                          <Eye className="h-4 w-4 2xl:h-5 2xl:w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditSubject(row)}
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
        openRowId &&
        dropdownRect &&
        (() => {
          const row = filteredRows.find(r => r.id === openRowId)
          if (!row) return null
          const menuWidth = 180
          return createPortal(
            <>
              <div
                className="fixed inset-0 z-[100]"
                aria-hidden
                onClick={() => {
                  setOpenRowId(null)
                  setDropdownRect(null)
                }}
              />
              <div
                className="fixed z-[101] min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg"
                style={{
                  top: dropdownRect.top + 4,
                  left: Math.max(8, dropdownRect.right - menuWidth),
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    toggleStatusMutation.mutate(
                      { id: row.id, isActive: true },
                      {
                        onSuccess: () => {
                          setOpenRowId(null)
                          setDropdownRect(null)
                        },
                      }
                    )
                  }}
                  disabled={toggleStatusMutation.isPending}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-green-600 hover:bg-muted dark:text-green-400"
                >
                  <UserCheck className="h-4 w-4 shrink-0" />
                  Active Subject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggleStatusMutation.mutate(
                      { id: row.id, isActive: false },
                      {
                        onSuccess: () => {
                          setOpenRowId(null)
                          setDropdownRect(null)
                        },
                      }
                    )
                  }}
                  disabled={toggleStatusMutation.isPending}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-muted dark:text-red-400"
                >
                  <UserX className="h-4 w-4 shrink-0" />
                  Inactive Subject
                </button>
              </div>
            </>,
            document.body
          )
        })()}

      {viewSubject && (
        <ViewSubjectModal
          subject={viewSubject}
          loading={false}
          onClose={() => setViewSubject(null)}
          title={viewModalTitle}
        />
      )}

      {addOpen && (
        <AddSubjectModal
          onClose={() => setAddOpen(false)}
          onSuccess={() => {
            invalidateList()
            toast.success('Subject created successfully')
          }}
          title={addModalTitle}
          subtitle={addModalSubtitle}
        />
      )}

      {editSubject && (
        <EditSubjectModal
          subject={editSubject}
          onClose={() => setEditSubject(null)}
          onSuccess={() => {
            invalidateList()
            toast.success('Subject updated successfully')
          }}
          title={editModalTitle}
          subtitle={editModalSubtitle}
        />
      )}
    </div>
  )
}
