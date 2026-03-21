import { Calendar, Eye, User, X } from 'lucide-react'
import type { Blog, BlogComment } from '@/features/blogs/api'
import { Button, LoadingSpinner, Modal } from '@/components/ui'
import { formatDateTimeShort } from '@/utils/formatters'
import { sanitizeRichText } from '@/utils/string'

export interface BlogDetailModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  blog: Blog | null
  comments: BlogComment[]
  commentsLoading: boolean
  commentsTotalPages: number
  commentPage: number
  onCommentPagePrev: () => void
  onCommentPageNext: () => void
  commentDraft: string
  onCommentDraftChange: (value: string) => void
  onPostComment: () => void
  isPostingComment: boolean
}

export function BlogDetailModal({
  isOpen,
  onClose,
  isLoading,
  blog,
  comments,
  commentsLoading,
  commentsTotalPages,
  commentPage,
  onCommentPagePrev,
  onCommentPageNext,
  commentDraft,
  onCommentDraftChange,
  onPostComment,
  isPostingComment,
}: BlogDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="6xl"
      showCloseButton={false}
      closeOnOverlayClick={false}
      overlayClassName="fixed inset-0 z-modal flex items-center justify-center bg-black/30 p-4"
      className="max-h-[95vh] overflow-auto rounded-xl p-0 shadow-2xl"
    >
      <div className="p-6">
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <h2 className="text-4xl font-semibold text-slate-800">
            {isLoading ? 'Loading...' : (blog?.title ?? 'Blog Details')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-600 hover:bg-slate-100"
            aria-label="Close details"
          >
            <X className="size-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-10 text-center text-slate-500">
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner size="md" className="text-slate-500" />
              Loading blog details...
            </span>
          </div>
        ) : blog ? (
          <div className="space-y-4 pt-4">
            {blog.cover_image_url ? (
              <img
                src={blog.cover_image_url}
                alt={blog.title}
                className="h-[420px] w-full rounded-lg object-cover"
              />
            ) : (
              <div className="h-[420px] w-full rounded-lg bg-gradient-to-br from-indigo-950 via-indigo-800 to-blue-700" />
            )}

            <div className="flex items-center justify-end gap-6 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <User className="size-4" />
                {blog.author?.name ?? 'Unknown'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4" />
                {formatDateTimeShort(blog.created_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-4" />
                {blog.view_count.toLocaleString()}
              </span>
            </div>

            <article
              className="space-y-2 text-2xl leading-9 text-slate-700"
              dangerouslySetInnerHTML={{
                __html: sanitizeRichText(blog.content),
              }}
            />

            <p className="text-2xl font-medium text-slate-600">
              {blog.hashtags.length > 0
                ? blog.hashtags.map(tag => `#${tag}`).join(' ')
                : '#study #techniques'}
            </p>

            <section className="space-y-3 border-t border-slate-200 pt-4">
              <h3 className="text-2xl font-semibold text-slate-700">
                Comments
              </h3>

              {commentsLoading ? (
                <p className="text-slate-500">Loading comments...</p>
              ) : comments.length > 0 ? (
                comments.map(comment => (
                  <div
                    key={comment.id}
                    className="rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <p className="text-xl text-slate-700">
                      {comment.comment_text}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {comment.commenter?.name ?? 'Unknown'} •{' '}
                      {formatDateTimeShort(comment.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No comments yet.</p>
              )}

              <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCommentPagePrev}
                  disabled={commentPage <= 1}
                  className="rounded border-slate-300 px-2 py-1 text-sm disabled:opacity-40"
                >
                  Previous
                </Button>
                <span>
                  Page {commentPage} / {commentsTotalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCommentPageNext}
                  disabled={commentPage >= commentsTotalPages}
                  className="rounded border-slate-300 px-2 py-1 text-sm disabled:opacity-40"
                >
                  Next
                </Button>
              </div>

              <textarea
                value={commentDraft}
                onChange={event => onCommentDraftChange(event.target.value)}
                rows={3}
                placeholder="Write a comment..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xl text-slate-700 outline-none focus:border-slate-400"
              />
              <Button
                type="button"
                onClick={onPostComment}
                disabled={isPostingComment}
                className="rounded-lg bg-slate-600 px-4 py-2 text-lg text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {isPostingComment ? 'Posting...' : 'Post Comment'}
              </Button>
            </section>
          </div>
        ) : (
          <div className="py-10 text-center text-slate-500">
            Unable to load blog detail.
          </div>
        )}
      </div>
    </Modal>
  )
}
