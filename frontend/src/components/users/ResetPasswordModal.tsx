import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { updateUser, type UpdateUserPayload } from '@/features/users/api'

export interface ResetPasswordModalProps {
  userUuid: string
  userName: string
  onClose: () => void
  onSuccess: () => void
  onError: (msg: string) => void
}

export function ResetPasswordModal({
  userUuid,
  userName,
  onClose,
  onSuccess,
  onError,
}: ResetPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(userUuid, payload),
    onSuccess: () => onSuccess(),
    onError: (err: Error) => onError(err.message || 'Failed to reset password'),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      onError('Password must be at least 8 characters')
      return
    }
    // eslint-disable-next-line security/detect-possible-timing-attacks
    if (password !== confirmPassword) {
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
