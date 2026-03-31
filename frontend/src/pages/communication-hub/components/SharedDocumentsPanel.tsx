import { useEffect, type ChangeEvent, type KeyboardEvent } from 'react'
import {
  CalendarDays,
  Download,
  FileText,
  LoaderCircle,
  MessageSquareText,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import type { ChatDocument, ChatDocumentComment } from '@/features/chat/api'
import { formatChatDate, formatFileSize } from './chat-utils'

type SharedDocumentsPanelProps = {
  documents: ChatDocument[]
  selectedDocumentId: number | null
  onSelectDocument: (documentId: number | null) => void
  isLoadingDocuments: boolean
  isFetchingMoreDocuments: boolean
  hasMoreDocuments: boolean
  onLoadMoreDocuments: () => void
  onUploadDocument: (file: File) => void
  isUploadingDocument: boolean
  comments: ChatDocumentComment[]
  isLoadingComments: boolean
  isFetchingMoreComments: boolean
  hasMoreComments: boolean
  onLoadMoreComments: () => void
  commentDraft: string
  onCommentDraftChange: (value: string) => void
  onCommentDraftKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onSubmitComment: () => void
  isSubmittingComment: boolean
}

export function SharedDocumentsPanel({
  documents,
  selectedDocumentId,
  onSelectDocument,
  isLoadingDocuments,
  isFetchingMoreDocuments,
  hasMoreDocuments,
  onLoadMoreDocuments,
  onUploadDocument,
  isUploadingDocument,
  comments,
  isLoadingComments,
  isFetchingMoreComments,
  hasMoreComments,
  onLoadMoreComments,
  commentDraft,
  onCommentDraftChange,
  onCommentDraftKeyDown,
  onSubmitComment,
  isSubmittingComment,
}: SharedDocumentsPanelProps) {
  const selectedDocument =
    documents.find(document => document.id === selectedDocumentId) ?? null
  const isCommentsOpen = selectedDocumentId !== null

  useEffect(() => {
    if (!isCommentsOpen) return

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onSelectDocument(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCommentsOpen, onSelectDocument])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0]
    if (!nextFile) return

    onUploadDocument(nextFile)
    event.target.value = ''
  }

  const handleOpenComments = (documentId: number) => {
    onSelectDocument(documentId)
  }

  const handleCloseComments = () => {
    onSelectDocument(null)
  }

  const handleDownloadDocument = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.rel = 'noreferrer'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-5 sm:py-5">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 px-6 py-7 text-center transition hover:border-blue-300 hover:bg-blue-50/40">
          <input
            type="file"
            className="sr-only"
            onChange={handleFileChange}
            disabled={isUploadingDocument}
          />
          <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            {isUploadingDocument ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}
          </div>
          <p className="text-sm font-medium text-foreground">
            {isUploadingDocument
              ? 'Uploading document...'
              : 'Click to upload document'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, DOCX, images, and other supporting files can be shared here.
          </p>
        </label>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {isLoadingDocuments ? (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading shared documents...
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-3">
              {documents.map(document => {
                const commentsCount = document.comments_count ?? 0

                return (
                  <div
                    key={document.id}
                    className="rounded-xl border border-border bg-background px-4 py-4 transition hover:border-blue-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-slate-50 text-slate-600">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {document.file_name}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <UserRound className="size-3.5" />
                                {document.uploader_name || 'Unknown uploader'}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="size-3.5" />
                                {formatChatDate(document.created_at)}
                              </span>
                              <span>
                                {formatFileSize(document.file_size_bytes)}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenComments(document.id)}
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-blue-200 hover:text-blue-600"
                              aria-label={`Open comments for ${document.file_name}`}
                            >
                              <MessageSquareText className="size-4" />
                            </button>
                            {document.file_url ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadDocument(
                                    document.file_url as string,
                                    document.file_name
                                  )
                                }
                                className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-blue-200 hover:text-blue-600"
                                aria-label={`Download ${document.file_name}`}
                              >
                                <Download className="size-4" />
                              </button>
                            ) : (
                              <span className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground/60">
                                <Download className="size-4" />
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenComments(document.id)}
                          className="mt-3 inline-flex items-center gap-2 text-[11px] text-muted-foreground transition hover:text-blue-600"
                        >
                          <MessageSquareText className="size-3.5" />
                          <span className="text-left">
                            {commentsCount} comment
                            {commentsCount === 1 ? '' : 's'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {isFetchingMoreDocuments ? (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" />
                  Loading more documents...
                </div>
              ) : null}

              {hasMoreDocuments ? (
                <button
                  type="button"
                  onClick={onLoadMoreDocuments}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Load more documents
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex h-full min-h-52 flex-col items-center justify-center rounded-xl border border-border bg-background px-6 text-center text-muted-foreground">
              <FileText className="mb-3 size-10" />
              <p className="text-sm font-medium text-foreground">
                No shared documents yet
              </p>
              <p className="mt-1 text-sm">
                Upload the first document for this conversation from the panel
                above.
              </p>
            </div>
          )}
        </div>
      </div>

      {isCommentsOpen && selectedDocument ? (
        <div
          role="presentation"
          className="fixed inset-0 z-modal flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-[2px]"
        >
          <button
            type="button"
            onClick={handleCloseComments}
            aria-label="Close modal overlay"
            className="absolute inset-0"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-comments-title"
            className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="document-comments-title"
                  className="truncate text-xl font-semibold text-foreground"
                >
                  {selectedDocument.file_name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comments and discussion...
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseComments}
                className="inline-flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
                aria-label="Close comments"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {isLoadingComments ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />
                    Loading comments...
                  </div>
                ) : comments.length > 0 ? (
                  comments.map(comment => (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-border bg-background px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {comment.commenter_name || 'Unknown user'}
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {comment.comment}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatCommentDateTime(comment.created_at)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                    No comments yet. Add the first note for this document.
                  </div>
                )}

                {isFetchingMoreComments ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircle className="size-4 animate-spin" />
                    Loading more comments...
                  </div>
                ) : null}
              </div>

              {hasMoreComments ? (
                <button
                  type="button"
                  onClick={onLoadMoreComments}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Load more comments
                </button>
              ) : null}

              <div className="flex items-end gap-2">
                <textarea
                  value={commentDraft}
                  onChange={event => onCommentDraftChange(event.target.value)}
                  onKeyDown={onCommentDraftKeyDown}
                  placeholder="Add a comment"
                  rows={1}
                  className="min-h-11 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                />
                <button
                  type="button"
                  onClick={onSubmitComment}
                  disabled={isSubmittingComment || !commentDraft.trim()}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-slate-700 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmittingComment ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function formatCommentDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
