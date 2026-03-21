import type { RefObject } from 'react'
import { Upload, X } from 'lucide-react'
import type { Blog } from '@/features/blogs/api'
import { Button, Modal } from '@/components/ui'

export interface BlogEditorModalProps {
  isOpen: boolean
  onClose: () => void
  editingBlog: Blog | null
  formTitle: string
  onTitleChange: (value: string) => void
  formHashtags: string
  onHashtagsChange: (value: string) => void
  formCoverPreview: string | null
  onCoverFileChange: (file: File | null) => void
  onRemoveCover: () => void
  editorRef: RefObject<HTMLDivElement | null>
  onEditorInput: (html: string) => void
  applyEditorCommand: (command: string, value?: string) => void
  onSave: () => void
  isSaving: boolean
}

export function BlogEditorModal({
  isOpen,
  onClose,
  editingBlog,
  formTitle,
  onTitleChange,
  formHashtags,
  onHashtagsChange,
  formCoverPreview,
  onCoverFileChange,
  onRemoveCover,
  editorRef,
  onEditorInput,
  applyEditorCommand,
  onSave,
  isSaving,
}: BlogEditorModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="5xl"
      showCloseButton={false}
      closeOnOverlayClick={false}
      overlayClassName="fixed inset-0 z-modal flex items-center justify-center bg-black/30 p-4"
      className="max-h-[95vh] overflow-auto rounded-xl p-0 shadow-2xl"
    >
      <div className="p-8">
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-3xl font-semibold text-slate-800">
              {editingBlog ? 'Edit Blog' : 'Create New Blog'}
            </h2>
            <p className="mt-1 text-xl text-slate-400">
              Fill in the details below to {editingBlog ? 'update' : 'add'} a
              blog....
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-600 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="size-6" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-lg font-medium text-slate-600">
              Cover Image
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={event =>
                onCoverFileChange(event.target.files?.[0] ?? null)
              }
              className="hidden"
              id="blog-cover-upload"
            />
            <label
              htmlFor="blog-cover-upload"
              className="flex h-52 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400"
            >
              {formCoverPreview ? (
                <img
                  src={formCoverPreview}
                  alt="Preview"
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <span className="inline-flex items-center gap-2 text-xl">
                  <Upload className="size-6" />
                  Upload Cover Image
                </span>
              )}
            </label>
          </label>

          {formCoverPreview ? (
            <button
              type="button"
              onClick={onRemoveCover}
              className="text-base text-red-500 hover:underline"
            >
              Remove cover image
            </button>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-lg font-medium text-slate-600">
              Title *
            </span>
            <input
              value={formTitle}
              onChange={event => onTitleChange(event.target.value)}
              placeholder="Advanced Mathematics"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-2xl text-slate-700 outline-none focus:border-slate-400"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-lg font-medium text-slate-600">
              Hash Tags *
            </span>
            <input
              value={formHashtags}
              onChange={event => onHashtagsChange(event.target.value)}
              placeholder="study, technical (comma-separated)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-2xl text-slate-700 outline-none focus:border-slate-400"
            />
          </label>

          <div className="block">
            <label
              htmlFor="blog-content-editor"
              className="mb-1 block text-lg font-medium text-slate-600"
            >
              Content *
            </label>
            <div className="rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 text-slate-500">
                <button
                  type="button"
                  onClick={() => applyEditorCommand('undo')}
                  className="rounded p-1 hover:bg-slate-100"
                  aria-label="Undo"
                >
                  ↶
                </button>
                <button
                  type="button"
                  onClick={() => applyEditorCommand('redo')}
                  className="rounded p-1 hover:bg-slate-100"
                  aria-label="Redo"
                >
                  ↷
                </button>
                <span className="mx-2 text-base">Rich text</span>
                <button
                  type="button"
                  onClick={() => applyEditorCommand('bold')}
                  className="rounded px-2 py-1 text-base font-semibold hover:bg-slate-100"
                  aria-label="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => applyEditorCommand('italic')}
                  className="rounded px-2 py-1 text-base italic hover:bg-slate-100"
                  aria-label="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => applyEditorCommand('underline')}
                  className="rounded px-2 py-1 text-base underline hover:bg-slate-100"
                  aria-label="Underline"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => applyEditorCommand('insertUnorderedList')}
                  className="rounded px-2 py-1 text-base hover:bg-slate-100"
                  aria-label="Bulleted list"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => applyEditorCommand('insertOrderedList')}
                  className="rounded px-2 py-1 text-base hover:bg-slate-100"
                  aria-label="Numbered list"
                >
                  1. List
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyEditorCommand('formatBlock', 'blockquote')
                  }
                  className="rounded px-2 py-1 text-base hover:bg-slate-100"
                  aria-label="Quote"
                >
                  Quote
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.prompt('Enter URL (https://...)')
                    if (!url) return
                    applyEditorCommand('createLink', url)
                  }}
                  className="rounded px-2 py-1 text-base hover:bg-slate-100"
                  aria-label="Insert link"
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => applyEditorCommand('removeFormat')}
                  className="rounded px-2 py-1 text-base hover:bg-slate-100"
                  aria-label="Clear formatting"
                >
                  Clear
                </button>
              </div>
              <div
                id="blog-content-editor"
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={event =>
                  onEditorInput(
                    (event.currentTarget as HTMLDivElement).innerHTML
                  )
                }
                className="min-h-[260px] w-full rounded-b-lg px-3 py-2 text-xl text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-lg border-slate-200 px-6 py-2 text-2xl text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="rounded-lg bg-slate-600 px-10 py-2 text-2xl font-medium text-white hover:bg-slate-700"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
