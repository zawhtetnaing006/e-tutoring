import { X } from 'lucide-react'
import type { UserResource } from '@/features/users/api'
import { getUserRoleLabel } from '@/features/auth/role-utils'
import { formatDateTime } from '@/utils'

interface ViewUserModalProps {
  user: UserResource | null
  loading: boolean
  onClose: () => void
  title?: string
  variant?: 'default' | 'staff' | 'tutor' | 'student'
  assignedTutorName?: string
  semesterPeriod?: string
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value ?? '—'}</dd>
    </>
  )
}

export function ViewUserModal({
  user,
  loading,
  onClose,
  title = 'User details',
  variant = 'default',
  assignedTutorName,
  semesterPeriod,
}: ViewUserModalProps) {
  const subjectLabel =
    variant === 'tutor' || variant === 'student' ? 'Subject' : 'Role'
  const subjectValue =
    variant === 'staff'
      ? getUserRoleLabel(user)
      : user?.subjects?.length
        ? user.subjects.map(s => s.name).join(', ')
        : '—'

  return (
    <div className="fixed inset-0 z-modal !mt-0 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4 2xl:p-6">
      <div className="my-auto flex w-full max-w-[calc(100vw-1.5rem)] flex-col rounded-xl border border-border bg-card shadow-lg sm:max-w-lg 2xl:max-w-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-4 sm:px-6 2xl:px-8 2xl:py-5">
          <h2 className="truncate pr-2 text-lg font-semibold text-foreground 2xl:text-xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground 2xl:h-10 2xl:w-10"
            aria-label="Close"
          >
            <X className="h-4 w-4 2xl:h-5 2xl:w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-4 sm:p-6 2xl:p-8">
          {loading && (
            <p className="py-8 text-center text-muted-foreground">Loading...</p>
          )}

          {!loading && user && (variant === 'staff' || variant === 'tutor') && (
            <div className="space-y-6 text-sm 2xl:space-y-8 2xl:text-base">
              <section>
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 2xl:grid-cols-[180px_1fr] 2xl:gap-x-6 2xl:gap-y-4">
                  <DetailRow label="Name" value={user.name} />
                  <DetailRow label="Email Address" value={user.email} />
                  <DetailRow label="Phone Number" value={user.phone} />
                  <DetailRow label={subjectLabel} value={subjectValue} />
                  <DetailRow
                    label="Created At"
                    value={formatDateTime(user.created_at)}
                  />
                  <DetailRow
                    label="Updated At"
                    value={formatDateTime(user.updated_at)}
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-foreground">
                  Address Information
                </h3>
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <DetailRow label="Country" value={user.country} />
                  <DetailRow label="City" value={user.city} />
                  <DetailRow label="Township" value={user.township} />
                  <DetailRow label="Address" value={user.address} />
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
                  <DetailRow label="Name" value={user.name} />
                  <DetailRow label="Email Address" value={user.email} />
                  <DetailRow label="Phone Number" value={user.phone} />
                  <DetailRow label="Subject" value={subjectValue} />
                  <DetailRow
                    label="Created At"
                    value={formatDateTime(user.created_at)}
                  />
                  <DetailRow
                    label="Updated At"
                    value={formatDateTime(user.updated_at)}
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-foreground">
                  Assigned Tutor
                </h3>
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <DetailRow label="Tutor" value={assignedTutorName} />
                  <DetailRow label="Semester Period" value={semesterPeriod} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-foreground">
                  Address Information
                </h3>
                <div className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3">
                  <DetailRow label="Country" value={user.country} />
                  <DetailRow label="City" value={user.city} />
                  <DetailRow label="Township" value={user.township} />
                  <DetailRow label="Address" value={user.address} />
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
                <dd className="text-foreground">{getUserRoleLabel(user)}</dd>
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
