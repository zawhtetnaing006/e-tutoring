import { useState, type FormEvent } from 'react'
import { User, X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useSubjects } from '@/features/subjects/useSubjects'
import { useUsersList } from '@/features/users/useUsersList'
import { createClassRooms } from '@/features/class-rooms/api'
import {
  createUser,
  type UserResource,
  type CreateUserPayload,
} from '@/features/users/api'
import type { LayoutVariant } from './types'

export interface AddUserModalProps {
  userType: 'STAFF' | 'STUDENT' | 'TUTOR'
  onClose: () => void
  onSuccess: () => void
  onError: (msg: string) => void
  title?: string
  subtitle?: string
  useStaffLayout?: boolean
  layoutVariant?: LayoutVariant
}

export function AddUserModal({
  userType,
  onClose,
  onSuccess,
  onError,
  title,
  subtitle,
  useStaffLayout = false,
  layoutVariant,
}: AddUserModalProps) {
  const { data: subjectsData } = useSubjects({ perPage: 100 })
  const subjects = (subjectsData?.data ?? []).filter(s => s.is_active)
  const { data: tutorsData } = useUsersList({
    userType: 'TUTOR',
    perPage: 100,
    enabled: layoutVariant === 'student',
  })
  const tutors = (tutorsData?.data ?? []).filter(t => t.is_active)
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

  const handleSubmit = (e: FormEvent) => {
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
                        setForm(f => ({
                          ...f,
                          phone: e.target.value || null,
                        }))
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
                        setForm(f => ({
                          ...f,
                          phone: e.target.value || null,
                        }))
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
                            role_code: e.target.value as
                              | 'STAFF'
                              | 'STUDENT'
                              | 'TUTOR',
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
                          setForm(f => ({
                            ...f,
                            city: e.target.value || null,
                          }))
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
