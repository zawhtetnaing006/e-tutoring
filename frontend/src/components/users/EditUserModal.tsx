import { useState, type FormEvent } from 'react'
import { User, X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useSubjects } from '@/features/subjects/useSubjects'
import { useUsersList } from '@/features/users/useUsersList'
import { createClassRooms } from '@/features/class-rooms/api'
import {
  updateUser,
  type UserResource,
  type UpdateUserPayload,
} from '@/features/users/api'
import type { LayoutVariant } from './types'

export interface EditUserModalProps {
  user: UserResource
  onClose: () => void
  onSuccess: () => void
  onError: (msg: string) => void
  title?: string
  subtitle?: string
  useStaffLayout?: boolean
  layoutVariant?: LayoutVariant
}

export function EditUserModal({
  user,
  onClose,
  onSuccess,
  onError,
  title,
  subtitle,
  useStaffLayout = false,
  layoutVariant,
}: EditUserModalProps) {
  const { data: subjectsData } = useSubjects({ perPage: 100 })
  const subjects = (subjectsData?.data ?? []).filter(s => s.is_active)
  const { data: tutorsData } = useUsersList({
    userType: 'TUTOR',
    perPage: 100,
    enabled: layoutVariant === 'student',
  })
  const tutors = (tutorsData?.data ?? []).filter(t => t.is_active)
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

  const handleSubmit = (e: FormEvent) => {
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
                        setForm(f => ({
                          ...f,
                          phone: e.target.value || null,
                        }))
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
                        setForm(f => ({
                          ...f,
                          phone: e.target.value || null,
                        }))
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
