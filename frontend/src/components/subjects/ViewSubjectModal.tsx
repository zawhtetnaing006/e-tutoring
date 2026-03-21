import { X } from 'lucide-react'
import { formatDateTime } from '@/utils'
import type { Subject } from '@/features/subjects/api'

export interface ViewSubjectModalProps {
  subject: Subject | null
  loading: boolean
  onClose: () => void
  title?: string
}

export function ViewSubjectModal({
  subject,
  loading,
  onClose,
  title = 'Detail Subject',
}: ViewSubjectModalProps) {
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
          {!loading && !subject && (
            <p className="py-8 text-center text-muted-foreground">
              No subject data
            </p>
          )}
          {!loading && subject && (
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
