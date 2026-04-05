import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button, FormLabel, Modal } from '@/components/ui'

export interface InsertLinkModalProps {
  isOpen: boolean
  onClose: () => void
  /** Shown when editing an existing link */
  initialUrl?: string
  onConfirm: (href: string) => void
}

function normalizeHref(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function InsertLinkModal({
  isOpen,
  onClose,
  initialUrl = '',
  onConfirm,
}: InsertLinkModalProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(initialUrl)

  useEffect(() => {
    if (!isOpen) return
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
    return () => cancelAnimationFrame(id)
  }, [isOpen])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const href = normalizeHref(url)
    if (!href) return
    onConfirm(href)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Insert link"
      size="sm"
      lockBodyScroll={false}
      closeOnOverlayClick
      closeOnEscape
      overlayClassName="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4"
      contentClassName="px-6 py-4"
      className="rounded-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel htmlFor={inputId}>URL</FormLabel>
          <input
            ref={inputRef}
            id={inputId}
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com"
            value={url}
            onChange={event => setUrl(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto"
            disabled={!normalizeHref(url)}
          >
            Apply
          </Button>
        </div>
      </form>
    </Modal>
  )
}
