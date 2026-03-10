import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, MessageSquare, Search, Send } from 'lucide-react'
import { toast } from 'sonner'
import { createBlog, createBlogComment } from '@/features/blogs/api'
import { useBlog, useBlogComments, useBlogs } from '@/features/blogs/useBlogs'
import { useDebouncedValue } from '@/hooks'

function formatDateTime(value: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString()
}

export function BlogsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedBlogId, setSelectedBlogId] = useState<number | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newComment, setNewComment] = useState('')
  const [commentPage, setCommentPage] = useState(1)
  const debouncedSearch = useDebouncedValue(search.trim(), 400)

  const blogsQuery = useBlogs({
    page,
    perPage: 8,
    search: debouncedSearch,
  })

  const blogs = useMemo(() => blogsQuery.data?.data ?? [], [blogsQuery.data?.data])

  useEffect(() => {
    if (blogs.length === 0) {
      setSelectedBlogId(null)
      return
    }

    if (selectedBlogId == null || !blogs.some(blog => blog.id === selectedBlogId)) {
      setSelectedBlogId(blogs[0].id)
      setCommentPage(1)
    }
  }, [blogs, selectedBlogId])

  const selectedBlogQuery = useBlog(selectedBlogId)
  const commentsQuery = useBlogComments(selectedBlogId, {
    page: commentPage,
    perPage: 10,
    enabled: selectedBlogId != null,
  })

  const createBlogMutation = useMutation({
    mutationFn: createBlog,
    onSuccess: blog => {
      toast.success('Blog posted', {
        description: 'Your blog is now visible to everyone.',
      })
      setNewTitle('')
      setNewContent('')
      setPage(1)
      setSelectedBlogId(blog.id)

      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
      void queryClient.invalidateQueries({ queryKey: ['blogs', 'detail', blog.id] })
    },
    onError: error => {
      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to post blog', { description })
    },
  })

  const createCommentMutation = useMutation({
    mutationFn: ({
      blogId,
      commentText,
    }: {
      blogId: number
      commentText: string
    }) =>
      createBlogComment(blogId, {
        comment_text: commentText,
      }),
    onSuccess: (_, variables) => {
      toast.success('Comment posted')
      setNewComment('')
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
      void queryClient.invalidateQueries({
        queryKey: ['blogs', 'detail', variables.blogId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['blogs', 'comments', variables.blogId],
      })
    },
    onError: error => {
      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to post comment', { description })
    },
  })

  const handleCreateBlog = () => {
    const title = newTitle.trim()
    const content = newContent.trim()

    if (!title || !content) {
      toast.error('Please provide a title and content before posting.')
      return
    }

    createBlogMutation.mutate({ title, content })
  }

  const handleCreateComment = () => {
    if (selectedBlogId == null) return

    const commentText = newComment.trim()
    if (!commentText) {
      toast.error('Please write a comment first.')
      return
    }

    createCommentMutation.mutate({ blogId: selectedBlogId, commentText })
  }

  return (
    <div className="w-full space-y-6">
      <section>
        <h1 className="text-2xl font-semibold text-foreground">Blogs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your learning experience and discuss with others.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-background p-4">
            <h2 className="text-base font-semibold text-foreground">Create Blog</h2>
            <div className="mt-3 space-y-3">
              <input
                value={newTitle}
                onChange={event => setNewTitle(event.target.value)}
                placeholder="Blog title"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <textarea
                value={newContent}
                onChange={event => setNewContent(event.target.value)}
                placeholder="Write your blog post..."
                rows={5}
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <button
                type="button"
                onClick={handleCreateBlog}
                disabled={createBlogMutation.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {createBlogMutation.isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post Blog'
                )}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={event => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Search blogs..."
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="mt-4 space-y-2">
              {blogsQuery.isLoading ? (
                <div className="py-6 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="size-4 animate-spin" />
                    Loading blogs...
                  </span>
                </div>
              ) : blogs.length > 0 ? (
                blogs.map(blog => (
                  <button
                    type="button"
                    key={blog.id}
                    onClick={() => {
                      setSelectedBlogId(blog.id)
                      setCommentPage(1)
                    }}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      selectedBlogId === blog.id
                        ? 'border-slate-300 bg-slate-50'
                        : 'border-border bg-background hover:bg-muted/30'
                    }`}
                  >
                    <p className="line-clamp-1 text-sm font-medium text-foreground">
                      {blog.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      by {blog.author?.name ?? 'Unknown'} •{' '}
                      {blog.comment_count ?? 0} comment(s)
                    </p>
                  </button>
                ))
              ) : (
                <p className="py-6 text-sm text-muted-foreground">
                  No blog posts found.
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setPage(current => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border px-3 py-1.5 text-foreground disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-muted-foreground">
                Page {page} / {blogsQuery.data?.total_page ?? 1}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage(current =>
                    Math.min(blogsQuery.data?.total_page ?? current, current + 1)
                  )
                }
                disabled={page >= (blogsQuery.data?.total_page ?? 1)}
                className="rounded-lg border border-border px-3 py-1.5 text-foreground disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </aside>

        <div className="rounded-2xl border border-border bg-background p-5">
          {selectedBlogId == null ? (
            <p className="text-sm text-muted-foreground">
              Select a blog from the left to read and comment.
            </p>
          ) : selectedBlogQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Loading blog details...
              </span>
            </p>
          ) : selectedBlogQuery.data ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedBlogQuery.data.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  by {selectedBlogQuery.data.author?.name ?? 'Unknown'} •{' '}
                  {formatDateTime(selectedBlogQuery.data.created_at)}
                </p>
              </div>

              <article className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {selectedBlogQuery.data.content}
              </article>

              <section className="space-y-4 border-t border-border pt-4">
                <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
                  <MessageSquare className="size-4" />
                  Comments
                </h3>

                <div className="space-y-2">
                  {commentsQuery.isLoading ? (
                    <p className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <LoaderCircle className="size-4 animate-spin" />
                        Loading comments...
                      </span>
                    </p>
                  ) : (commentsQuery.data?.data.length ?? 0) > 0 ? (
                    commentsQuery.data?.data.map(comment => (
                      <div
                        key={comment.id}
                        className="rounded-lg border border-border bg-muted/20 px-3 py-2"
                      >
                        <p className="text-sm text-foreground">{comment.comment_text}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {comment.commenter?.name ?? 'Unknown'} •{' '}
                          {formatDateTime(comment.created_at)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No comments yet. Be the first to comment.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setCommentPage(current => Math.max(1, current - 1))
                    }
                    disabled={commentPage <= 1}
                    className="rounded-lg border border-border px-3 py-1.5 text-foreground disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-muted-foreground">
                    Page {commentPage} / {commentsQuery.data?.total_page ?? 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCommentPage(current =>
                        Math.min(
                          commentsQuery.data?.total_page ?? current,
                          current + 1
                        )
                      )
                    }
                    disabled={commentPage >= (commentsQuery.data?.total_page ?? 1)}
                    className="rounded-lg border border-border px-3 py-1.5 text-foreground disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={event => setNewComment(event.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                  <button
                    type="button"
                    onClick={handleCreateComment}
                    disabled={createCommentMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {createCommentMutation.isPending ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Post Comment
                      </>
                    )}
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Unable to load the selected blog.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
