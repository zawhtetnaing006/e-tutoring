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
  UserCheck,
  UserX,
  KeyRound,
  User,
  CirclePlus,
} from 'lucide-react'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useUsersList } from '@/features/users/useUsersList'
import { getUserRoleLabel } from '@/features/auth/role-utils'
import {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  type ListUser,
  type UserResource,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '@/features/users/api'
import { useSubjects } from '@/features/subjects/useSubjects'
import { createClassRooms } from '@/features/class-rooms/api'

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

function ViewUserModal({
  user,
  loading,
  onClose,
  title = 'User details',
  variant = 'default',
  assignedTutorName,
  semesterPeriod,
}: {
  user: UserResource | null
  loading: boolean
  onClose: () => void
  title?: string
  variant?: 'default' | 'staff' | 'tutor' | 'student'
  assignedTutorName?: string
  semesterPeriod?: string
}) {
  const subjectLabel =
    variant === 'tutor' ? 'Subject' : variant === 'student' ? 'Subject' : 'Role'
  const subjectValue =
    variant === 'staff'
      ? getRoleLabel(user)
      : user?.subjects?.length
        ? user.subjects.map(s => s.name).join(', ')
        : '—'

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
          {loading && (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          )}
          {!loading && user && (variant === 'staff' || variant === 'tutor') && (
            <div className="space-y-6 text-sm">
              <section>
                {/* <h3 className="mb-3 font-semibold text-foreground">
                  {variant === 'staff' ? 'Staff Details' : 'Tutor Details'}
                </h3> */}
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground">{user.name}</dd>
                  <dt className="text-muted-foreground">Email Address</dt>
                  <dd className="text-foreground">{user.email}</dd>
                  <dt className="text-muted-foreground">Phone Number</dt>
                  <dd className="text-foreground">{user.phone ?? '—'}</dd>
                  <dt className="text-muted-foreground">{subjectLabel}</dt>
                  <dd className="text-foreground">{subjectValue}</dd>
                  <dt className="text-muted-foreground">Created At</dt>
                  <dd className="text-foreground">
                    {formatDateTime(user.created_at)}
                  </dd>
                  <dt className="text-muted-foreground">Updated At</dt>
                  <dd className="text-foreground">
                    {formatDateTime(user.updated_at)}
                  </dd>
                </div>
              </section>
              <section>
                <h3 className="mb-3 font-semibold text-foreground">
                  Address Information
                </h3>
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <dt className="text-muted-foreground">Country</dt>
                  <dd className="text-foreground">{user.country ?? '—'}</dd>
                  <dt className="text-muted-foreground">City</dt>
                  <dd className="text-foreground">{user.city ?? '—'}</dd>
                  <dt className="text-muted-foreground">Township</dt>
                  <dd className="text-foreground">{user.township ?? '—'}</dd>
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="text-foreground">{user.address ?? '—'}</dd>
                </div>
              </section>
            </div>
          )}
          {!loading && user && variant === 'student' && (
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="mb-3 font-semibold text-foreground">
                  Student Details
                </h3>
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground">{user.name}</dd>
                  <dt className="text-muted-foreground">Email Address</dt>
                  <dd className="text-foreground">{user.email}</dd>
                  <dt className="text-muted-foreground">Phone Number</dt>
                  <dd className="text-foreground">{user.phone ?? '—'}</dd>
                  <dt className="text-muted-foreground">Subject</dt>
                  <dd className="text-foreground">{subjectValue}</dd>
                  <dt className="text-muted-foreground">Created At</dt>
                  <dd className="text-foreground">
                    {formatDateTime(user.created_at)}
                  </dd>
                  <dt className="text-muted-foreground">Updated At</dt>
                  <dd className="text-foreground">
                    {formatDateTime(user.updated_at)}
                  </dd>
                </div>
              </section>
              <section>
                <h3 className="mb-3 font-semibold text-foreground">
                  Assigned Tutor
                </h3>
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <dt className="text-muted-foreground">Tutor</dt>
                  <dd className="text-foreground">
                    {assignedTutorName ?? '—'}
                  </dd>
                  <dt className="text-muted-foreground">Semester Period</dt>
                  <dd className="text-foreground">{semesterPeriod ?? '—'}</dd>
                </div>
              </section>
              <section>
                <h3 className="mb-3 font-semibold text-foreground">
                  Address Information
                </h3>
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <dt className="text-muted-foreground">Country</dt>
                  <dd className="text-foreground">{user.country ?? '—'}</dd>
                  <dt className="text-muted-foreground">City</dt>
                  <dd className="text-foreground">{user.city ?? '—'}</dd>
                  <dt className="text-muted-foreground">Township</dt>
                  <dd className="text-foreground">{user.township ?? '—'}</dd>
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="text-foreground">{user.address ?? '—'}</dd>
                </div>
              </section>
            </div>
          )}
          {!loading && user && variant === 'default' && (
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium text-foreground">{user.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-foreground">{user.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="text-foreground">{user.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Address</dt>
                <dd className="text-foreground">
                  {[user.address, user.country, user.city, user.township]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Role</dt>
                <dd className="text-foreground">{getRoleLabel(user)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="text-foreground">
                  {user.is_active ? 'Active' : 'Inactive'}
                </dd>
              </div>
              {user.subjects && user.subjects.length > 0 && (
                <div>
                  <dt className="text-muted-foreground">Subjects</dt>
                  <dd className="text-foreground">
                    {user.subjects.map(s => s.name).join(', ')}
                  </dd>
                </div>
              )}
            </dl>
          )}
          {!loading && !user && (
            <p className="py-8 text-center text-muted-foreground">
              Failed to load user.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function AddUserModal({
  userType,
  onClose,
  onSuccess,
  onError,
  title,
  subtitle,
  useStaffLayout = false,
  layoutVariant,
}: {
  userType: 'STAFF' | 'STUDENT' | 'TUTOR'
  onClose: () => void
  onSuccess: () => void
  onError: (msg: string) => void
  title?: string
  subtitle?: string
  useStaffLayout?: boolean
  layoutVariant?: LayoutVariant
}) {
  const { data: subjectsData } = useSubjects({ perPage: 100 })
  const subjects = subjectsData?.data ?? []
  const { data: tutorsData } = useUsersList({
    userType: 'TUTOR',
    perPage: 100,
    enabled: layoutVariant === 'student',
  })
  const tutors = tutorsData?.data ?? []
  const [form, setForm] = useState<CreateUserPayload>({
    name: '',
    email: '',
    role_code: userType,
    auto_generate_password: true,
    phone: '',
    address: '',
    country: '',
    city: '',
    township: '',
    is_active: true,
    subject_ids: [],
  })
  const [assignedTutorId, setAssignedTutorId] = useState<number | ''>('')
  const [semesterFrom, setSemesterFrom] = useState('')
  const [semesterTo, setSemesterTo] = useState('')

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async (data: UserResource) => {
      if (
        layoutVariant === 'student' &&
        assignedTutorId &&
        semesterFrom &&
        semesterTo &&
        data.id
      ) {
        try {
          await createClassRooms({
            tutor_user_id: assignedTutorId,
            student_user_ids: [data.id],
            from_date: semesterFrom,
            to_date: semesterTo,
          })
        } catch (err) {
          onError(err instanceof Error ? err.message : 'Failed to assign tutor')
          return
        }
      }
      onSuccess()
    },
    onError: (err: Error) => onError(err.message || 'Failed to create user'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      layoutVariant === 'student' &&
      (!assignedTutorId || !semesterFrom || !semesterTo)
    ) {
      onError('Please select a tutor and semester period')
      return
    }
    const payload = { ...form }
    if (form.auto_generate_password) {
      payload.password = undefined
    } else {
      if (!form.password || form.password.length < 8) {
        onError('Password must be at least 8 characters')
        return
      }
      if (
        (useStaffLayout || layoutVariant === 'student') &&
        form.password !==
          (form as { password_confirmation?: string }).password_confirmation
      ) {
        onError('Passwords do not match')
        return
      }
    }
    createMutation.mutate(payload)
  }

  const displayTitle = title ?? 'Add user'
  const useTutorLayout = layoutVariant === 'tutor'
  const useStudentLayout = layoutVariant === 'student'
  const nameLabel =
    useStaffLayout || useTutorLayout || useStudentLayout
      ? 'Full Name *'
      : 'Name *'
  const emailLabel =
    useStaffLayout || useTutorLayout || useStudentLayout
      ? 'Email Address *'
      : 'Email *'

  return (
    <div className="fixed inset-0 z-modal !mt-0 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
      <div className="my-auto flex max-h-[90vh] w-full max-w-[calc(100vw-1.5rem)] flex-col rounded-xl border border-border bg-card shadow-lg sm:max-w-lg">
        <div className="flex shrink-0 items-start justify-between border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0 pr-2">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {displayTitle}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground sm:line-clamp-2">
                {subtitle}
              </p>
            )}
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
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            {(useStaffLayout || useTutorLayout || useStudentLayout) && (
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <User className="h-4 w-4" />
                </span>
                Basic Information
              </div>
            )}
            {useTutorLayout ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    {nameLabel}
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Michael Grant"
                      value={form.name}
                      onChange={e =>
                        setForm(f => ({ ...f, name: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    {emailLabel}
                    <input
                      type="email"
                      required
                      placeholder="e.g. michael.grant@etut..."
                      value={form.email}
                      onChange={e =>
                        setForm(f => ({ ...f, email: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Phone Number *
                    <input
                      type="text"
                      required
                      placeholder="e.g. +44 20 8123 3001"
                      value={form.phone ?? ''}
                      onChange={e =>
                        setForm(f => ({ ...f, phone: e.target.value || null }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Subject Speciality *
                    <select
                      required
                      value={form.subject_ids?.[0] ?? ''}
                      onChange={e =>
                        setForm(f => ({
                          ...f,
                          subject_ids: e.target.value
                            ? [Number(e.target.value)]
                            : [],
                        }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">Select a subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between gap-2">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-foreground">
                      {nameLabel}
                      <input
                        type="text"
                        required
                        placeholder={
                          useStaffLayout
                            ? 'e.g. Dr. Andrew Collins'
                            : useStudentLayout
                              ? 'e.g. John Doe'
                              : undefined
                        }
                        value={form.name}
                        onChange={e =>
                          setForm(f => ({ ...f, name: e.target.value }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </label>
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-foreground">
                      {emailLabel}
                      <input
                        type="email"
                        required
                        placeholder={
                          useStaffLayout
                            ? 'e.g. andrew.collins@etut...'
                            : useStudentLayout
                              ? 'e.g. john@example.com'
                              : undefined
                        }
                        value={form.email}
                        onChange={e =>
                          setForm(f => ({ ...f, email: e.target.value }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Phone Number {useStudentLayout ? '*' : ''}
                    <input
                      type="text"
                      required={!!useStudentLayout}
                      placeholder={
                        useStaffLayout
                          ? 'e.g. +44 20 7946 1001'
                          : useStudentLayout
                            ? 'e.g. +959 123 123134'
                            : undefined
                      }
                      value={form.phone ?? ''}
                      onChange={e =>
                        setForm(f => ({ ...f, phone: e.target.value || null }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    />
                  </label>
                </div>
                {useStaffLayout && (
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Choose Role *
                      <select
                        required
                        value={form.role_code ?? userType}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            role_code: e.target.value as 'STAFF' | 'STUDENT' | 'TUTOR',
                          }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                      >
                        <option value="STAFF">Staff</option>
                      </select>
                    </label>
                  </div>
                )}
                {useStudentLayout && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Speciality Subjects
                          <select
                            value={form.subject_ids?.[0] ?? ''}
                            onChange={e =>
                              setForm(f => ({
                                ...f,
                                subject_ids: e.target.value
                                  ? [Number(e.target.value)]
                                  : [],
                              }))
                            }
                            className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                          >
                            <option value="">Select a subjects</option>
                            {subjects.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Select Tutor *
                          <select
                            required
                            value={assignedTutorId}
                            onChange={e =>
                              setAssignedTutorId(
                                e.target.value ? Number(e.target.value) : ''
                              )
                            }
                            className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                          >
                            <option value="">Select a tutor</option>
                            {tutors.map(t => (
                              <option
                                key={t.uuid}
                                value={(t as UserResource).id ?? ''}
                              >
                                {t.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Semester Period *
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Tutor assignments automatically expire when the
                          semester ends.
                        </p>
                        <div className="mt-1 flex gap-2">
                          <input
                            type="date"
                            required
                            value={semesterFrom}
                            onChange={e => setSemesterFrom(e.target.value)}
                            className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                          />
                          <span className="self-center text-muted-foreground">
                            –
                          </span>
                          <input
                            type="date"
                            required
                            value={semesterTo}
                            onChange={e => setSemesterTo(e.target.value)}
                            className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                          />
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </>
            )}
            {/* {(useStaffLayout || useTutorLayout || useStudentLayout) && (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <MapPin className="h-4 w-4" />
              </span>
              Address Information
            </div>
          )} */}
            {(useStaffLayout || useTutorLayout || useStudentLayout) &&
              (useTutorLayout ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Country
                      <input
                        type="text"
                        placeholder="e.g. United Kingdom"
                        value={form.country ?? ''}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            country: e.target.value || null,
                          }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      City
                      <input
                        type="text"
                        placeholder="e.g. London"
                        value={form.city ?? ''}
                        onChange={e =>
                          setForm(f => ({ ...f, city: e.target.value || null }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Township
                      <input
                        type="text"
                        placeholder="e.g. Greenwich"
                        value={form.township ?? ''}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            township: e.target.value || null,
                          }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Address
                      <input
                        type="text"
                        placeholder="e.g. 12 Park Row, Green..."
                        value={form.address ?? ''}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            address: e.target.value || null,
                          }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between gap-2">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-foreground">
                        Country
                        <input
                          type="text"
                          placeholder="e.g. United Kingdom"
                          value={form.country ?? ''}
                          onChange={e =>
                            setForm(f => ({
                              ...f,
                              country: e.target.value || null,
                            }))
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                        />
                      </label>
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-foreground">
                        City
                        <input
                          type="text"
                          placeholder="e.g. London"
                          value={form.city ?? ''}
                          onChange={e =>
                            setForm(f => ({
                              ...f,
                              city: e.target.value || null,
                            }))
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-between gap-2">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-foreground">
                        Township
                        <input
                          type="text"
                          placeholder="e.g. Greenwich"
                          value={form.township ?? ''}
                          onChange={e =>
                            setForm(f => ({
                              ...f,
                              township: e.target.value || null,
                            }))
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                        />
                      </label>
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-foreground">
                        Address
                        <input
                          type="text"
                          placeholder="e.g. 12 Park Row, Green..."
                          value={form.address ?? ''}
                          onChange={e =>
                            setForm(f => ({
                              ...f,
                              address: e.target.value || null,
                            }))
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                        />
                      </label>
                    </div>
                  </div>
                </>
              ))}
            {!useStaffLayout && !useTutorLayout && !useStudentLayout && (
              <>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="auto-password"
                    name="password-mode"
                    checked={form.auto_generate_password ?? true}
                    onChange={() =>
                      setForm(f => ({ ...f, auto_generate_password: true }))
                    }
                    className="h-4 w-4 border-input"
                  />
                  <label
                    htmlFor="auto-password"
                    className="text-sm text-foreground"
                  >
                    Auto-generate password
                  </label>
                </div>
                {!form.auto_generate_password && (
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Password (min 8 characters)
                      <input
                        type="password"
                        minLength={8}
                        value={form.password ?? ''}
                        onChange={e =>
                          setForm(f => ({ ...f, password: e.target.value }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                  </div>
                )}
              </>
            )}
            {(useStaffLayout || useTutorLayout || useStudentLayout) && (
              <div className="space-y-3">
                <div className="flex flex-col items-start">
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      id="auto-password-variant"
                      name="password-mode-variant"
                      checked={form.auto_generate_password ?? true}
                      onChange={() =>
                        setForm(f => ({ ...f, auto_generate_password: true }))
                      }
                      className="mt-1 h-4 w-4 border-input"
                    />
                    <label
                      htmlFor="auto-password-variant"
                      className="text-sm text-foreground"
                    >
                      Automatically generate a password
                    </label>
                  </div>
                  <p className="ml-6 text-xs text-muted-foreground">
                    A secure password has been generated and sent to your
                    registered email address.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="create-password-variant"
                    name="password-mode-variant"
                    checked={!form.auto_generate_password}
                    onChange={() =>
                      setForm(f => ({ ...f, auto_generate_password: false }))
                    }
                    className="h-4 w-4 border-input"
                  />
                  <label
                    htmlFor="create-password-variant"
                    className="text-sm text-foreground"
                  >
                    Create Password
                  </label>
                </div>
                {!form.auto_generate_password && (
                  <div className="flex gap-2">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-foreground">
                        Account Password *
                        <input
                          type="password"
                          minLength={8}
                          required={!form.auto_generate_password}
                          value={form.password ?? ''}
                          onChange={e =>
                            setForm(f => ({ ...f, password: e.target.value }))
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                    </div>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-foreground">
                        Confirm Password *
                        <input
                          type="password"
                          minLength={8}
                          required={!form.auto_generate_password}
                          value={
                            (form as { password_confirmation?: string })
                              .password_confirmation ?? ''
                          }
                          onChange={e =>
                            setForm(
                              f =>
                                ({
                                  ...f,
                                  password_confirmation: e.target.value,
                                }) as CreateUserPayload & {
                                  password_confirmation?: string
                                }
                            )
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* {!useStaffLayout && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Phone
                </label>
                <input
                  type="text"
                  value={form.phone ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value || null }))
                  }
                  className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Address
                </label>
                <input
                  type="text"
                  value={form.address ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value || null }))
                  }
                  className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Country
                  </label>
                  <input
                    type="text"
                    value={form.country ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value || null }))
                    }
                    className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    City
                  </label>
                  <input
                    type="text"
                    value={form.city ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value || null }))
                    }
                    className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Township
                  </label>
                  <input
                    type="text"
                    value={form.township ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, township: e.target.value || null }))
                    }
                    className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
              </div>
              {subjects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Subjects
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <label
                        key={s.id}
                        className="inline-flex items-center gap-1.5 rounded border border-input bg-background px-2 py-1 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.subject_ids?.includes(s.id) ?? false}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              subject_ids: e.target.checked
                                ? [...(f.subject_ids ?? []), s.id]
                                : (f.subject_ids ?? []).filter((id) => id !== s.id),
                            }))
                          }
                          className="h-3.5 w-3.5 rounded border-input"
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )} */}
            {/* {useStaffLayout && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="add-active-staff"
                checked={form.is_active ?? true}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor="add-active-staff" className="text-sm text-foreground">
                Active
              </label>
            </div>
          )} */}
            {/* {(useTutorLayout || useStudentLayout) && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="add-active-role"
                checked={form.is_active ?? true}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-input"
              />
              <label htmlFor="add-active-role" className="text-sm text-foreground">
                Active
              </label>
            </div>
          )} */}
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-border px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending
                ? 'Creating...'
                : useStaffLayout || useTutorLayout || useStudentLayout
                  ? 'Save'
                  : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditUserModal({
  user,
  onClose,
  onSuccess,
  onError,
  title,
  subtitle,
  useStaffLayout = false,
  layoutVariant,
}: {
  user: UserResource
  onClose: () => void
  onSuccess: () => void
  onError: (msg: string) => void
  title?: string
  subtitle?: string
  useStaffLayout?: boolean
  layoutVariant?: LayoutVariant
}) {
  const { data: subjectsData } = useSubjects({ perPage: 100 })
  const subjects = subjectsData?.data ?? []
  const { data: tutorsData } = useUsersList({
    userType: 'TUTOR',
    perPage: 100,
    enabled: layoutVariant === 'student',
  })
  const tutors = tutorsData?.data ?? []
  const useTutorLayout = layoutVariant === 'tutor'
  const useStudentLayout = layoutVariant === 'student'
  const [form, setForm] = useState<UpdateUserPayload>({
    name: user.name,
    email: user.email,
    phone: user.phone ?? '',
    address: user.address ?? '',
    country: user.country ?? '',
    city: user.city ?? '',
    township: user.township ?? '',
    is_active: user.is_active,
    subject_ids: user.subjects?.map(s => s.id) ?? [],
  })
  const [assignedTutorId, setAssignedTutorId] = useState<number | ''>('')
  const [semesterFrom, setSemesterFrom] = useState('')
  const [semesterTo, setSemesterTo] = useState('')

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(user.uuid, payload),
    onSuccess: async () => {
      if (
        useStudentLayout &&
        assignedTutorId &&
        semesterFrom &&
        semesterTo &&
        user.id != null
      ) {
        try {
          await createClassRooms({
            tutor_user_id: assignedTutorId,
            student_user_ids: [user.id],
            from_date: semesterFrom,
            to_date: semesterTo,
          })
        } catch (err) {
          onError(err instanceof Error ? err.message : 'Failed to assign tutor')
          return
        }
      }
      onSuccess()
    },
    onError: (err: Error) => onError(err.message || 'Failed to update user'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      ...form,
      phone: form.phone || null,
      address: form.address || null,
      country: form.country || null,
      city: form.city || null,
      township: form.township || null,
    })
  }

  const displayTitle = title ?? 'Edit user'

  return (
    <div className="fixed inset-0 z-modal !mt-0 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
      <div className="my-auto flex max-h-[90vh] w-full max-w-[calc(100vw-1.5rem)] flex-col rounded-xl border border-border bg-card shadow-lg sm:max-w-lg">
        <div className="flex shrink-0 items-start justify-between border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0 pr-2">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {displayTitle}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground sm:line-clamp-2">
                {subtitle}
              </p>
            )}
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
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            {(useStaffLayout || useTutorLayout || useStudentLayout) && (
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <User className="h-4 w-4" />
                </span>
                Basic Information
              </div>
            )}
            {useTutorLayout ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Full Name *
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e =>
                        setForm(f => ({ ...f, name: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Email Address *
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e =>
                        setForm(f => ({ ...f, email: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Phone Number *
                    <input
                      type="text"
                      value={form.phone ?? ''}
                      onChange={e =>
                        setForm(f => ({ ...f, phone: e.target.value || null }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Subject Speciality *
                    <select
                      value={form.subject_ids?.[0] ?? ''}
                      onChange={e =>
                        setForm(f => ({
                          ...f,
                          subject_ids: e.target.value
                            ? [Number(e.target.value)]
                            : [],
                        }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                    >
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ) : null}
            {useTutorLayout && (
              <>
                {/* <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                </span>
                Address Information
              </div> */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Country
                      <input
                        type="text"
                        value={form.country ?? ''}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            country: e.target.value || null,
                          }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      City
                      <input
                        type="text"
                        value={form.city ?? ''}
                        onChange={e =>
                          setForm(f => ({ ...f, city: e.target.value || null }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Township
                      <input
                        type="text"
                        value={form.township ?? ''}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            township: e.target.value || null,
                          }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Address
                      <input
                        type="text"
                        value={form.address ?? ''}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            address: e.target.value || null,
                          }))
                        }
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                      />
                    </label>
                  </div>
                </div>
              </>
            )}
            {!useTutorLayout && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    {useStaffLayout || useStudentLayout
                      ? 'Full Name *'
                      : 'Name *'}
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e =>
                        setForm(f => ({ ...f, name: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    {useStaffLayout || useStudentLayout
                      ? 'Email Address *'
                      : 'Email *'}
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e =>
                        setForm(f => ({ ...f, email: e.target.value }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-foreground">
                    {useStaffLayout || useStudentLayout
                      ? 'Phone Number *'
                      : 'Phone'}
                    <input
                      type="text"
                      value={form.phone ?? ''}
                      onChange={e =>
                        setForm(f => ({ ...f, phone: e.target.value || null }))
                      }
                      className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>
                {useStaffLayout && (
                  <div className="w-full">
                    <label className="block text-sm font-medium text-foreground">
                      Choose Role *
                      <select
                        value="STAFF"
                        className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                        disabled
                      >
                        <option value="STAFF">Staff</option>
                      </select>
                    </label>
                  </div>
                )}
                {useStudentLayout && (
                  <>
                    <div className="w-full">
                      <label className="block text-sm font-medium text-foreground">
                        Speciality Subjects
                        <select
                          value={form.subject_ids?.[0] ?? ''}
                          onChange={e =>
                            setForm(f => ({
                              ...f,
                              subject_ids: e.target.value
                                ? [Number(e.target.value)]
                                : [],
                            }))
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                        >
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-foreground">
                        Select Tutor
                        <select
                          value={assignedTutorId}
                          onChange={e =>
                            setAssignedTutorId(
                              e.target.value ? Number(e.target.value) : ''
                            )
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                        >
                          <option value="">Select a tutor</option>
                          {tutors.map(t => (
                            <option
                              key={t.uuid}
                              value={(t as UserResource).id ?? ''}
                            >
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-foreground">
                        Semester Period
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Tutor assignments automatically expire when the
                          semester ends.
                        </p>
                        <div className="mt-1 flex gap-2">
                          <input
                            type="date"
                            value={semesterFrom}
                            onChange={e => setSemesterFrom(e.target.value)}
                            className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                          />
                          <span className="self-center text-muted-foreground">
                            –
                          </span>
                          <input
                            type="date"
                            value={semesterTo}
                            onChange={e => setSemesterTo(e.target.value)}
                            className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                          />
                        </div>
                      </label>
                    </div>
                  </>
                )}
                {/* {(useStaffLayout || useTutorLayout || useStudentLayout) && (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <MapPin className="h-4 w-4" />
              </span>
              Address Information
            </div>
          )} */}
                {useStaffLayout || useStudentLayout ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Country
                        <input
                          type="text"
                          value={form.country ?? ''}
                          onChange={e =>
                            setForm(f => ({
                              ...f,
                              country: e.target.value || null,
                            }))
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        City
                        <input
                          type="text"
                          value={form.city ?? ''}
                          onChange={e =>
                            setForm(f => ({
                              ...f,
                              city: e.target.value || null,
                            }))
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Township
                        <input
                          type="text"
                          value={form.township ?? ''}
                          onChange={e =>
                            setForm(f => ({
                              ...f,
                              township: e.target.value || null,
                            }))
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Address
                        <input
                          type="text"
                          value={form.address ?? ''}
                          onChange={e =>
                            setForm(f => ({
                              ...f,
                              address: e.target.value || null,
                            }))
                          }
                          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  !useTutorLayout && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Address
                          <input
                            type="text"
                            value={form.address ?? ''}
                            onChange={e =>
                              setForm(f => ({
                                ...f,
                                address: e.target.value || null,
                              }))
                            }
                            className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-foreground">
                            Country
                            <input
                              type="text"
                              value={form.country ?? ''}
                              onChange={e =>
                                setForm(f => ({
                                  ...f,
                                  country: e.target.value || null,
                                }))
                              }
                              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                            />
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground">
                            City
                            <input
                              type="text"
                              value={form.city ?? ''}
                              onChange={e =>
                                setForm(f => ({
                                  ...f,
                                  city: e.target.value || null,
                                }))
                              }
                              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                            />
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground">
                            Township
                            <input
                              type="text"
                              value={form.township ?? ''}
                              onChange={e =>
                                setForm(f => ({
                                  ...f,
                                  township: e.target.value || null,
                                }))
                              }
                              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
                            />
                          </label>
                        </div>
                      </div>
                    </>
                  )
                )}
                {!useStaffLayout &&
                  !useTutorLayout &&
                  !useStudentLayout &&
                  subjects.length > 0 && (
                    <fieldset>
                      <legend className="block text-sm font-medium text-foreground">
                        Subjects
                      </legend>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {subjects.map(s => (
                          <label
                            key={s.id}
                            className="inline-flex items-center gap-1.5 rounded border border-input bg-background px-2 py-1 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={
                                form.subject_ids?.includes(s.id) ?? false
                              }
                              onChange={e =>
                                setForm(f => ({
                                  ...f,
                                  subject_ids: e.target.checked
                                    ? [...(f.subject_ids ?? []), s.id]
                                    : (f.subject_ids ?? []).filter(
                                        id => id !== s.id
                                      ),
                                }))
                              }
                              className="h-3.5 w-3.5 rounded border-input"
                            />
                            {s.name}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
              </div>
            )}
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-border px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResetPasswordModal({
  userUuid,
  userName,
  onClose,
  onSuccess,
  onError,
}: {
  userUuid: string
  userName: string
  onClose: () => void
  onSuccess: () => void
  onError: (msg: string) => void
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(userUuid, payload),
    onSuccess: () => onSuccess(),
    onError: (err: Error) => onError(err.message || 'Failed to reset password'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      onError('Password must be at least 8 characters')
      return
    }
    // Compare in a way that avoids timing attacks (constant-time check)
    const passwordsMatch =
      password.length === confirmPassword.length &&
      password.split('').every((c, i) => c === confirmPassword[i])
    if (!passwordsMatch) {
      onError('Passwords do not match')
      return
    }
    updateMutation.mutate({ password, password_confirmation: confirmPassword })
  }

  return (
    <div className="fixed inset-0 z-modal !mt-0 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
      <div className="my-auto w-full max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-card p-4 shadow-lg sm:max-w-md sm:p-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-semibold text-foreground">
            Reset Password
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
        <p className="mt-2 text-sm text-muted-foreground">
          Set a new password for {userName}.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground">
              New Password *
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Confirm Password *
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export type LayoutVariant = 'staff' | 'tutor' | 'student'

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
    if (!window.confirm(`Delete "${row.name}"? This cannot be undone.`)) return
    deleteMutation.mutate(row.uuid)
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
    <div className="w-full max-w-6xl p-3">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-foreground sm:text-xl">
            {title}
          </h1>
          <p className="mt-0.5 truncate text-sm text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <CirclePlus className="h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">{addLabel}</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
        <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[120px] sm:max-w-[220px] sm:flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex shrink-0 gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring sm:px-4"
            aria-label="Filter"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring sm:px-4"
          >
            <FileUp className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-10 shrink-0 p-2 sm:w-12 sm:p-3">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-input"
                    aria-label="Select all"
                  />
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3">
                  <span className="inline-flex items-center gap-1">
                    Name
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </span>
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3">
                  Role
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3">
                  <span className="inline-flex items-center gap-1">
                    Email
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </span>
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3">
                  <span className="inline-flex items-center gap-1">
                    Phone
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </span>
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3">
                  <span className="inline-flex items-center gap-1">
                    Address
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </span>
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3">
                  <span className="inline-flex items-center gap-1">
                    Status
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </span>
                </th>
                <th className="whitespace-nowrap p-2 font-semibold text-foreground sm:p-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6 text-center text-muted-foreground sm:p-8"
                  >
                    Loading...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6 text-center text-destructive sm:p-8"
                  >
                    Failed to load data.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-6 text-center text-muted-foreground sm:p-8"
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
                    className="border-b border-border hover:bg-muted/30"
                  >
                    <td className="w-10 shrink-0 p-2 sm:w-12 sm:p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.uuid)}
                        onChange={() => toggleSelect(row.uuid)}
                        className="h-4 w-4 rounded border-input"
                        aria-label={`Select ${row.name}`}
                      />
                    </td>
                    <td className="min-w-[120px] p-2 font-medium text-foreground sm:p-3">
                      <span className="break-words">{row.name}</span>
                    </td>
                    <td className="whitespace-nowrap p-2 text-muted-foreground sm:p-3">
                      {truncate(getRoleLabel(row), 18)}
                    </td>
                    <td className="min-w-[140px] p-2 text-muted-foreground sm:p-3">
                      <span
                        className="block max-w-[180px] truncate"
                        title={row.email}
                      >
                        {truncate(row.email, 24)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-2 text-muted-foreground sm:p-3">
                      {row.phone ?? '—'}
                    </td>
                    <td className="min-w-[120px] max-w-[180px] p-2 text-muted-foreground sm:p-3">
                      <span
                        className="block truncate"
                        title={formatAddress(row)}
                      >
                        {truncate(formatAddress(row), 24)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-2 sm:p-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium sm:px-2.5 ${
                          row.is_active
                            ? 'bg-success/15 text-success'
                            : 'bg-destructive/15 text-destructive'
                        }`}
                      >
                        {row.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="w-[1%] whitespace-nowrap p-2 sm:p-3">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <button
                          type="button"
                          onClick={() => setViewUuid(row.uuid)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={`View ${row.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditUuid(row.uuid)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={`Edit ${row.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          disabled={deleteMutation.isPending}
                          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
                          aria-label={`Delete ${row.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
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
                              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                              aria-label="More options"
                              aria-expanded={openRowUuid === row.uuid}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="More options"
                          >
                            <MoreVertical className="h-4 w-4" />
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
        <div className="flex flex-col gap-3 border-t border-border px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">Rows per page:</span>
            <select
              value={perPage}
              onChange={e => {
                setPerPage(Number(e.target.value))
                setPage(1)
              }}
              className="h-8 rounded border border-input bg-background pl-2 pr-8 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Rows per page"
            >
              {ROWS_PER_PAGE_OPTIONS.map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground sm:justify-end sm:gap-4">
            <span className="whitespace-nowrap">
              {totalItems === 0
                ? '0-0 of 0'
                : `${start}-${end} of ${totalItems}`}
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:pointer-events-none disabled:opacity-50"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
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
                className="fixed z-[101] min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg"
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
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-green-600 hover:bg-muted dark:text-green-400"
                >
                  <UserCheck className="h-4 w-4 shrink-0" />
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
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-muted dark:text-red-400"
                >
                  <UserX className="h-4 w-4 shrink-0" />
                  {dropdownInactiveLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenRowUuid(null)
                    setDropdownRect(null)
                    setResetPasswordUuid(row.uuid)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  <KeyRound className="h-4 w-4 shrink-0" />
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
    </div>
  )
}
