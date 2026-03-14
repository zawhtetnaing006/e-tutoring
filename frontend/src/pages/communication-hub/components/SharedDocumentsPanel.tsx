import type { ChangeEvent, KeyboardEvent } from 'react'
import {
  Download,
  FileText,
  LoaderCircle,
  MessageSquareText,
  SendHorizontal,
  Upload,
} from 'lucide-react'
import type {
  ChatDocument,
  ChatDocumentComment,
} from '@/features/chat/api'
import {
  formatChatDate,
  formatFileSize,
} from './chat-utils'

type SharedDocumentsPanelProps = {
  documents: ChatDocument[]
  selectedDocumentId: number | null
  onSelectDocument: (documentId: number) => void
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
    documents.find(document => document.id === selectedDocumentId) ??
    documents[0] ??
    null

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0]
    if (!nextFile) return

    onUploadDocument(nextFile)
    event.target.value = ''
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 py-5">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/50">
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
          {isUploadingDocument ? 'Uploading document...' : 'Click to upload document'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF, DOCX, images, and other supporting files can be shared here.
        </p>
      </label>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
        {isLoadingDocuments ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Loading shared documents...
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map(document => {
              const isSelected = document.id === selectedDocument?.id
              const commentsCount = document.comments_count ?? 0

              return (
                <div
                  key={document.id}
                  className={`overflow-hidden rounded-2xl border bg-background transition ${
                    isSelected
                      ? 'border-blue-300 shadow-sm'
                      : 'border-border hover:border-blue-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDocument(document.id)}
                    className="flex w-full items-start gap-3 px-4 py-4 text-left"
                  >
                    <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <FileText className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {document.file_name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            <span>{document.uploader_name || 'Unknown uploader'}</span>
                            <span>{formatChatDate(document.created_at)}</span>
                            <span>{formatFileSize(document.file_size_bytes)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {document.file_url ? (
                            <a
                              href={document.file_url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={event => event.stopPropagation()}
                              className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-blue-200 hover:text-blue-600"
                              aria-label={`Download ${document.file_name}`}
                            >
                              <Download className="size-4" />
                            </a>
                          ) : (
                            <span className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground/60">
                              <Download className="size-4" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <MessageSquareText className="size-3.5" />
                        <span>
                          {commentsCount} comment{commentsCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </div>
                  </button>

                  {isSelected ? (
                    <div className="border-t border-border bg-muted/10 px-4 py-4">
                      <div className="space-y-3">
                        <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                          {isLoadingComments ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <LoaderCircle className="size-4 animate-spin" />
                              Loading comments...
                            </div>
                          ) : comments.length > 0 ? (
                            comments.map(comment => (
                              <div
                                key={comment.id}
                                className="rounded-xl border border-border bg-background px-3 py-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-xs font-medium text-foreground">
                                    {comment.commenter_name || 'Unknown user'}
                                  </p>
                                  <span className="text-[11px] text-muted-foreground">
                                    {formatMessageTime(comment.created_at)}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-foreground">
                                  {comment.comment}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No comments yet. Add the first note for this document.
                            </p>
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

                        <div className="flex items-end gap-3">
                          <textarea
                            value={commentDraft}
                            onChange={event => onCommentDraftChange(event.target.value)}
                            onKeyDown={onCommentDraftKeyDown}
                            placeholder="Write a comment..."
                            rows={2}
                            className="min-h-12 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                          />
                          <button
                            type="button"
                            onClick={onSubmitComment}
                            disabled={isSubmittingComment || !commentDraft.trim()}
                            className="inline-flex size-12 items-center justify-center rounded-xl bg-slate-700 text-white transition hover:bg-slate-800 disabled:opacity-50"
                          >
                            {isSubmittingComment ? (
                              <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                              <SendHorizontal className="size-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
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
          <div className="flex h-full min-h-52 flex-col items-center justify-center rounded-2xl border border-border bg-background px-6 text-center text-muted-foreground">
            <FileText className="mb-3 size-10" />
            <p className="text-sm font-medium text-foreground">
              No shared documents yet
            </p>
            <p className="mt-1 text-sm">
              Upload the first document for this conversation from the panel above.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}
