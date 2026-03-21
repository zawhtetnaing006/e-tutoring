import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import {
  createSubject,
  type CreateSubjectPayload,
} from '@/features/subjects/api'
import { SubjectFormFields } from './SubjectFormFields'

export interface AddSubjectModalProps {
  onClose: () => void
  onSuccess: () => void
  title?: string
  subtitle?: string
}

export function AddSubjectModal({
  onClose,
  onSuccess,
  title = 'Create New Subject',
  subtitle = 'Fill in the details below to add a new subject...',
}: AddSubjectModalProps) {
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
          <SubjectFormFields
            nameId="name"
            descriptionId="description"
            form={form}
            onChange={setForm}
          />
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
