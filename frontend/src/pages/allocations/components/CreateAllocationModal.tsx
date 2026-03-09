import { useDeferredValue, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, LoaderCircle, Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/features/auth'
import {
  type Allocation,
  createAllocation,
  type CreateAllocationPayload,
  type UpdateAllocationPayload,
  updateAllocation,
} from '@/features/allocations/api'
import { useUsers } from '@/features/users/useUsers'

type UserPickerProps = {
  label: string
  placeholder: string
  users: User[]
  searchValue: string
  onSearchChange: (value: string) => void
  error?: string | null
  isLoading: boolean
}

type SingleUserPickerProps = UserPickerProps & {
  value: number | null
  selectedUser: User | null
  onSelect: (userId: number) => void
}

function getUserLabel(user: User) {
  return `${user.name} (${user.user_type})`
}

function SingleUserPicker({
  label,
  placeholder,
  users,
  searchValue,
  onSearchChange,
  error,
  isLoading,
  value,
  selectedUser,
  onSelect,
}: SingleUserPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border px-3 py-2">
          {selectedUser ? (
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm text-foreground">
                {getUserLabel(selectedUser)}
              </span>
            </div>
          ) : null}
          <div className="relative">
            <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchValue}
              onChange={event => onSearchChange(event.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent py-1 pl-6 pr-0 text-sm text-foreground outline-none"
            />
          </div>
        </div>
        <div className="max-h-52 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading options...
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-1">
              {users.map(user => (
                <label
                  key={user.uuid}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                >
                  <input
                    type="radio"
                    name={label}
                    checked={value === user.id}
                    onChange={() => onSelect(user.id as number)}
                    className="size-4"
                  />
                  <span className="text-foreground">{getUserLabel(user)}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No users found.
            </p>
          )}
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

type MultiUserPickerProps = UserPickerProps & {
  value: number[]
  selectedUsers: User[]
  onToggle: (userId: number) => void
}

function MultiUserPicker({
  label,
  placeholder,
  users,
  searchValue,
  onSearchChange,
  error,
  isLoading,
  value,
  selectedUsers,
  onToggle,
}: MultiUserPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border px-3 py-2">
          {selectedUsers.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <span
                  key={user.uuid}
                  className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm text-foreground"
                >
                  {user.name}
                </span>
              ))}
            </div>
          ) : null}
          <div className="relative">
            <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchValue}
              onChange={event => onSearchChange(event.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent py-1 pl-6 pr-0 text-sm text-foreground outline-none"
            />
          </div>
        </div>
        <div className="max-h-52 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading options...
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-1">
              {users.map(user => (
                <label
                  key={user.uuid}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(user.id as number)}
                    onChange={() => onToggle(user.id as number)}
                    className="size-4"
                  />
                  <span className="text-foreground">{getUserLabel(user)}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No users found.
            </p>
          )}
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

type CreateAllocationModalProps = {
  isOpen: boolean
  onClose: () => void
  mode?: 'create' | 'edit'
  allocation?: Allocation | null
  tutors?: User[]
  students?: User[]
}

function getInitialForm(
  allocation: Allocation | null
): CreateAllocationPayload {
  if (allocation) {
    return {
      tutor_user_id: allocation.tutor_user_id,
      student_user_ids: [allocation.student_user_id],
      from_date: allocation.from_date,
      to_date: allocation.to_date,
    }
  }

  return {
    tutor_user_id: 0,
    student_user_ids: [],
    from_date: '',
    to_date: '',
  }
}

export function CreateAllocationModal({
  isOpen,
  onClose,
  mode = 'create',
  allocation = null,
  tutors = [],
  students = [],
}: CreateAllocationModalProps) {
  const queryClient = useQueryClient()
  const [tutorSearch, setTutorSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const deferredTutorSearch = useDeferredValue(tutorSearch.trim())
  const deferredStudentSearch = useDeferredValue(studentSearch.trim())
  const [form, setForm] = useState<CreateAllocationPayload>(() =>
    getInitialForm(allocation)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isEditMode = mode === 'edit'

  const tutorsQuery = useUsers({
    perPage: 10,
    userType: 'TUTOR',
    name: deferredTutorSearch,
    enabled: isOpen,
  })
  const studentsQuery = useUsers({
    perPage: 10,
    userType: 'STUDENT',
    name: deferredStudentSearch,
    enabled: isOpen,
  })

  const createMutation = useMutation({
    mutationFn: createAllocation,
    onSuccess: createdAllocations => {
      toast.success('Allocation created', {
        description: `${createdAllocations.length} allocation(s) created successfully.`,
      })
      void queryClient.invalidateQueries({ queryKey: ['allocations'] })
      onClose()
    },
    onError: error => {
      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to create allocation', { description })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateAllocationPayload
    }) => updateAllocation(id, payload),
    onSuccess: () => {
      toast.success('Allocation updated', {
        description: 'The allocation has been updated successfully.',
      })
      void queryClient.invalidateQueries({ queryKey: ['allocations'] })
      onClose()
    },
    onError: error => {
      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to update allocation', { description })
    },
  })

  const tutorOptions = useMemo(() => {
    const map = new Map<number, User>()

    ;[...tutors, ...(tutorsQuery.data?.data ?? [])].forEach(user => {
      if (user.id != null) map.set(user.id, user)
    })

    return [...map.values()]
  }, [tutors, tutorsQuery.data?.data])

  const studentOptions = useMemo(() => {
    const map = new Map<number, User>()

    ;[...students, ...(studentsQuery.data?.data ?? [])].forEach(user => {
      if (user.id != null) map.set(user.id, user)
    })

    return [...map.values()]
  }, [students, studentsQuery.data?.data])

  const selectedStudents = studentOptions.filter(student =>
    form.student_user_ids.includes(student.id as number)
  )
  const selectedTutor =
    tutorOptions.find(tutor => tutor.id === form.tutor_user_id) ?? null
  const isSaving = createMutation.isPending || updateMutation.isPending

  if (!isOpen) return null

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!form.tutor_user_id) nextErrors.tutor_user_id = 'Tutor is required.'
    if (form.student_user_ids.length === 0) {
      nextErrors.student_user_ids = 'Select at least one student.'
    }
    if (!form.from_date) nextErrors.from_date = 'From date is required.'
    if (!form.to_date) nextErrors.to_date = 'To date is required.'
    if (form.from_date && form.to_date && form.from_date > form.to_date) {
      nextErrors.to_date = 'To date must be on or after from date.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    if (isEditMode) {
      if (!allocation) return

      updateMutation.mutate({
        id: allocation.id,
        payload: {
          tutor_user_id: form.tutor_user_id,
          student_user_id: form.student_user_ids[0],
          from_date: form.from_date,
          to_date: form.to_date,
        },
      })
      return
    }

    createMutation.mutate(form)
  }

  const handleToggleStudent = (userId: number) => {
    setForm(current => ({
      ...current,
      student_user_ids: current.student_user_ids.includes(userId)
        ? current.student_user_ids.filter(id => id !== userId)
        : [...current.student_user_ids, userId],
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {isEditMode
                ? 'Update Student Allocation'
                : 'Create New Student Allocation'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEditMode
                ? 'Adjust the allocation details below.'
                : 'Fill in the details below to add a new student allocation.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <SingleUserPicker
              label="Select Tutor *"
              placeholder="Find tutor by name"
              users={tutorOptions}
              searchValue={tutorSearch}
              onSearchChange={setTutorSearch}
              error={errors.tutor_user_id}
              isLoading={tutorsQuery.isLoading}
              value={form.tutor_user_id || null}
              selectedUser={selectedTutor}
              onSelect={userId =>
                setForm(current => ({ ...current, tutor_user_id: userId }))
              }
            />

            {isEditMode ? (
              <SingleUserPicker
                label="Select Student *"
                placeholder="Find student by name"
                users={studentOptions}
                searchValue={studentSearch}
                onSearchChange={setStudentSearch}
                error={errors.student_user_ids}
                isLoading={studentsQuery.isLoading}
                value={form.student_user_ids[0] ?? null}
                selectedUser={selectedStudents[0] ?? null}
                onSelect={userId =>
                  setForm(current => ({
                    ...current,
                    student_user_ids: [userId],
                  }))
                }
              />
            ) : (
              <MultiUserPicker
                label="Select Students *"
                placeholder="Find students by name"
                users={studentOptions}
                searchValue={studentSearch}
                onSearchChange={setStudentSearch}
                error={errors.student_user_ids}
                isLoading={studentsQuery.isLoading}
                value={form.student_user_ids}
                selectedUsers={selectedStudents}
                onToggle={handleToggleStudent}
              />
            )}
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Calendar className="size-4" />
              Semester Period
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Tutor assignments automatically expire when the semester ends.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="allocation-from-date"
                  className="text-sm font-medium text-foreground"
                >
                  From Date *
                </label>
                <input
                  id="allocation-from-date"
                  type="date"
                  value={form.from_date}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      from_date: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
                {errors.from_date ? (
                  <p className="text-xs text-destructive">{errors.from_date}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="allocation-to-date"
                  className="text-sm font-medium text-foreground"
                >
                  To Date *
                </label>
                <input
                  id="allocation-to-date"
                  type="date"
                  value={form.to_date}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      to_date: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
                {errors.to_date ? (
                  <p className="text-xs text-destructive">{errors.to_date}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {isEditMode ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
