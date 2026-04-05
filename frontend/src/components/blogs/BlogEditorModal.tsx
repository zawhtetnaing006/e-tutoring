import { useEffect, useMemo, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Blog } from '@/features/blogs/api'
import { Button, ConfirmDialog, FormLabel, Modal } from '@/components/ui'
import { hashtagsToInput, hasMeaningfulContent } from '@/utils/string'
import { BlogRichTextEditor } from './BlogRichTextEditor'

export interface BlogFormData {
  title: string
  content: string
  hashtags: string
  coverFile: File | null
  removeCoverImage: boolean
}

export interface BlogEditorModalProps {
  isOpen: boolean
  onClose: () => void
  editingBlog: Blog | null
  onSave: (data: BlogFormData) => void
  isSaving: boolean
}

interface InitialFormState {
  title: string
  hashtags: string
  content: string
  coverImageUrl: string | null
}

function getInitialFormValues(blog: Blog | null): {
  title: string
  hashtags: string
  content: string
  coverPreview: string | null
  initialState: InitialFormState
} {
  if (blog) {
    const initialHashtags = hashtagsToInput(blog.hashtags)
    return {
      title: blog.title,
      hashtags: initialHashtags,
      content: blog.content,
      coverPreview: blog.cover_image_url,
      initialState: {
        title: blog.title,
        hashtags: initialHashtags,
        content: blog.content,
        coverImageUrl: blog.cover_image_url,
      },
    }
  }
  return {
    title: '',
    hashtags: '',
    content: '',
    coverPreview: null,
    initialState: {
      title: '',
      hashtags: '',
      content: '',
      coverImageUrl: null,
    },
  }
}

function BlogEditorModalContent({
  editingBlog,
  onClose,
  onSave,
  isSaving,
}: {
  editingBlog: Blog | null
  onClose: () => void
  onSave: (data: BlogFormData) => void
  isSaving: boolean
}) {
  const initialValues = getInitialFormValues(editingBlog)
  const [title, setTitle] = useState(initialValues.title)
  const [hashtags, setHashtags] = useState(initialValues.hashtags)
  const [content, setContent] = useState(initialValues.content)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initialValues.coverPreview
  )
  const [removeCoverImage, setRemoveCoverImage] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [editorNestedModalOpen, setEditorNestedModalOpen] = useState(false)
  const [initialState] = useState<InitialFormState>(initialValues.initialState)
  const initialContentHtml = initialValues.content

  const isDirty = useMemo(() => {
    const titleChanged = title !== initialState.title
    const hashtagsChanged = hashtags !== initialState.hashtags
    const contentChanged = content !== initialState.content
    const coverChanged = coverFile !== null || removeCoverImage

    return titleChanged || hashtagsChanged || contentChanged || coverChanged
  }, [title, hashtags, content, coverFile, removeCoverImage, initialState])

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview)
      }
    }
  }, [coverPreview])

  const handleCloseRequest = () => {
    if (isDirty) {
      setShowDiscardConfirm(true)
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    if (coverPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview)
    }
    setShowDiscardConfirm(false)
    onClose()
  }

  const handleDiscardConfirm = () => {
    handleClose()
  }

  const handleDiscardCancel = () => {
    setShowDiscardConfirm(false)
  }

  const handleCoverFileChange = (file: File | null) => {
    if (coverPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview)
    }
    setCoverFile(file)
    setRemoveCoverImage(false)
    setCoverPreview(
      file ? URL.createObjectURL(file) : (editingBlog?.cover_image_url ?? null)
    )
  }

  const handleRemoveCover = () => {
    if (coverPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview)
    }
    setCoverFile(null)
    setCoverPreview(null)
    setRemoveCoverImage(true)
  }

  const handleSubmit = () => {
    const trimmedTitle = title.trim()

    if (!trimmedTitle || !hasMeaningfulContent(content)) {
      toast.error('Title and content are required.')
      return
    }

    onSave({
      title: trimmedTitle,
      content,
      hashtags,
      coverFile,
      removeCoverImage,
    })
  }

  const isSubmitDisabled = isSaving || (editingBlog !== null && !isDirty)

  return (
    <>
      <Modal
        isOpen
        onClose={handleCloseRequest}
        size="5xl"
        showCloseButton={false}
        closeOnOverlayClick={false}
        closeOnEscape={!showDiscardConfirm && !editorNestedModalOpen}
        overlayClassName="fixed inset-0 z-modal flex items-center justify-center bg-black/30 p-2 sm:p-4"
        className="flex max-h-[95vh] w-full flex-col overflow-hidden rounded-xl p-0 shadow-2xl"
        contentClassName="flex min-h-0 flex-1 flex-col"
      >
        {/* Header - Fixed */}
        <div className="shrink-0 border-b border-slate-200 px-4 py-4 sm:px-8 sm:py-6">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-slate-800 sm:text-lg">
                {editingBlog ? 'Edit Blog' : 'Create New Blog'}
              </h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Fill in the details below to {editingBlog ? 'update' : 'add'} a
                blog
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseRequest}
              className="shrink-0 rounded-full p-1 text-slate-600 hover:bg-slate-100"
              aria-label="Close modal"
            >
              <X className="size-5 sm:size-6" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <FormLabel htmlFor="blog-cover-upload">Cover Image</FormLabel>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={event =>
                  handleCoverFileChange(event.target.files?.[0] ?? null)
                }
                className="hidden"
                id="blog-cover-upload"
              />
              <label
                htmlFor="blog-cover-upload"
                className="flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-slate-400 sm:h-52"
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs sm:text-sm">
                    <Upload className="size-4 sm:size-5" />
                    Upload Cover Image
                  </span>
                )}
              </label>
              {coverPreview ? (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="mt-2 text-xs text-red-500 hover:underline sm:text-sm"
                >
                  Remove cover image
                </button>
              ) : null}
            </div>

            <div>
              <FormLabel htmlFor="blog-title" required>
                Title
              </FormLabel>
              <input
                id="blog-title"
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="Advanced Mathematics"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <FormLabel htmlFor="blog-hashtags" required>
                Hash Tags
              </FormLabel>
              <input
                id="blog-hashtags"
                value={hashtags}
                onChange={event => setHashtags(event.target.value)}
                placeholder="study, technical (comma-separated)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
              />
            </div>

            <div>
              <FormLabel htmlFor="blog-content-editor" required>
                Content
              </FormLabel>
              <BlogRichTextEditor
                initialHtml={initialContentHtml}
                onChange={setContent}
                onNestedModalOpenChange={setEditorNestedModalOpen}
              />
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="shrink-0 border-t border-slate-200 px-4 py-3 sm:px-8 sm:py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseRequest}
              className="w-full rounded-lg border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 sm:w-auto sm:px-6"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="w-full rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="warning"
      />
    </>
  )
}

export function BlogEditorModal({
  isOpen,
  onClose,
  editingBlog,
  onSave,
  isSaving,
}: BlogEditorModalProps) {
  if (!isOpen) return null
  return (
    <BlogEditorModalContent
      key={editingBlog?.id ?? 'create'}
      onClose={onClose}
      editingBlog={editingBlog}
      onSave={onSave}
      isSaving={isSaving}
    />
  )
}
