import { X } from 'lucide-react'

export interface DeleteUserConfirmationProps {
  userName: string
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

export function DeleteUserConfirmation({
  userName,
  onClose,
  onConfirm,
  isPending,
}: DeleteUserConfirmationProps) {
  return (
    <div className="fixed inset-0 z-modal !mt-0 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-4">
      <div className="my-auto w-full max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-card p-4 shadow-lg sm:max-w-md sm:p-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-lg font-semibold text-foreground">Delete user</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Delete &quot;{userName}&quot;? This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
