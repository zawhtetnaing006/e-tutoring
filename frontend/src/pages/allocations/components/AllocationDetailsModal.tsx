import { LoaderCircle, X } from 'lucide-react'
import type { User } from '@/features/auth'
import { useAllocation } from '@/features/allocations/useAllocations'

function formatDate(value: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString('en-CA')
}

function formatDateTime(value: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function findUserName(users: User[], userId: number, fallback: string) {
  return users.find(user => user.id === userId)?.name ?? fallback
}

type AllocationDetailsModalProps = {
  allocationId: number | null
  onClose: () => void
  users: User[]
}

export function AllocationDetailsModal({
  allocationId,
  onClose,
  users,
}: AllocationDetailsModalProps) {
  const allocationQuery = useAllocation(allocationId)

  if (allocationId == null) return null

  const allocation = allocationQuery.data

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <h2 className="text-xl font-semibold text-foreground">
            Detail Student Allocation
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {allocationQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading allocation details...
            </div>
          ) : allocation ? (
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Student
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {findUserName(
                    users,
                    allocation.student_user_id,
                    `Student #${allocation.student_user_id}`
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tutor
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {findUserName(
                    users,
                    allocation.tutor_user_id,
                    `Tutor #${allocation.tutor_user_id}`
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Semester Period
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {formatDate(allocation.from_date)} -{' '}
                  {formatDate(allocation.to_date)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Created At
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {formatDateTime(allocation.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Updated At
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {formatDateTime(allocation.updated_at)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Allocation details are unavailable.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
