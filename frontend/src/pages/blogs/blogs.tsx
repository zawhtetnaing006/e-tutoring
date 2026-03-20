import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Eye,
  Filter,
  LoaderCircle,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createBlog,
  createBlogComment,
  deleteBlog,
  toggleBlogStatus,
  updateBlog,
  type Blog,
} from '@/features/blogs/api'
import { getUserRole } from '@/features/auth/role-utils'
import { useBlog, useBlogComments, useBlogs } from '@/features/blogs/useBlogs'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useDebouncedValue } from '@/hooks'

const PAGE_SIZE = 9

type StatusFilter = 'all' | 'active' | 'inactive'

function formatDateTime(value: string) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getExcerpt(content: string, maxLength = 145) {
  if (content.length <= maxLength) return content
  return `${content.slice(0, maxLength)}...`
}

function stripHtml(content: string) {
  if (typeof window === 'undefined') {
    return content.replace(/<[^>]*>/g, ' ')
  }

  const doc = new DOMParser().parseFromString(content, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function hasMeaningfulContent(content: string) {
  return stripHtml(content).length > 0
}

function sanitizeRichText(content: string) {
  if (typeof window === 'undefined') return content

  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')
  const allowedTags = new Set([
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'a',
    'div',
  ])

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT)
  const elements: Element[] = []
  while (walker.nextNode()) {
    elements.push(walker.currentNode as Element)
  }

  elements.forEach(element => {
    const tag = element.tagName.toLowerCase()

    if (!allowedTags.has(tag)) {
      const parent = element.parentNode
      if (!parent) return
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element)
      }
      parent.removeChild(element)
      return
    }

    Array.from(element.attributes).forEach(attribute => {
      if (tag === 'a' && attribute.name === 'href') return
      element.removeAttribute(attribute.name)
    })

    if (tag === 'a') {
      const href = element.getAttribute('href') ?? ''
      const safe = /^(https?:|mailto:)/i.test(href)
      if (!safe) {
        element.removeAttribute('href')
      } else {
        element.setAttribute('rel', 'noopener noreferrer')
        element.setAttribute('target', '_blank')
      }
    }
  })

  return doc.body.innerHTML
}

function hashtagsToInput(hashtags: string[] | undefined) {
  return (hashtags ?? []).join(', ')
}

function canManageBlog(
  blog: Blog,
  currentUserId: number | undefined,
  currentUserRole: 'staff' | 'tutor' | 'student'
) {
  if (!currentUserId) return false
  if (currentUserRole === 'staff') return true
  return currentUserId === blog.author_user_id
}

export function BlogsPage() {
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const currentUserRole = getUserRole(currentUser)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [menuOpenBlogId, setMenuOpenBlogId] = useState<number | null>(null)

  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formHashtags, setFormHashtags] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formCoverFile, setFormCoverFile] = useState<File | null>(null)
  const [formCoverPreview, setFormCoverPreview] = useState<string | null>(null)
  const [removeCoverImage, setRemoveCoverImage] = useState(false)
  const editorRef = useRef<HTMLDivElement | null>(null)

  const [detailBlogId, setDetailBlogId] = useState<number | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentPage, setCommentPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search.trim(), 350)

  const blogsQuery = useBlogs({
    page,
    perPage: PAGE_SIZE,
    search: debouncedSearch,
    isActive:
      statusFilter === 'all'
        ? undefined
        : statusFilter === 'active'
          ? true
          : false,
  })

  const detailQuery = useBlog(detailBlogId)
  const commentsQuery = useBlogComments(detailBlogId, {
    page: commentPage,
    perPage: 8,
    enabled: detailBlogId != null,
  })

  const blogs = useMemo(
    () => blogsQuery.data?.data ?? [],
    [blogsQuery.data?.data]
  )

  const blogIds = useMemo(() => new Set(blogs.map(blog => blog.id)), [blogs])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSelectedIds(current => current.filter(id => blogIds.has(id)))
  }, [blogIds])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    return () => {
      if (formCoverPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(formCoverPreview)
      }
    }
  }, [formCoverPreview])

  useEffect(() => {
    if (!isEditorModalOpen || !editorRef.current) return
    if (editorRef.current.innerHTML === formContent) return
    editorRef.current.innerHTML = formContent
  }, [formContent, isEditorModalOpen])

  const createMutation = useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      toast.success('Blog created successfully.')
      closeEditorModal()
      setPage(1)
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create blog'
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      blogId,
      payload,
    }: {
      blogId: number
      payload: Parameters<typeof updateBlog>[1]
    }) => updateBlog(blogId, payload),
    onSuccess: () => {
      toast.success('Blog updated successfully.')
      closeEditorModal()
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
      if (detailBlogId != null) {
        void queryClient.invalidateQueries({
          queryKey: ['blogs', 'detail', detailBlogId],
        })
      }
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update blog'
      )
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: toggleBlogStatus,
    onSuccess: () => {
      toast.success('Blog status updated.')
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
      if (detailBlogId != null) {
        void queryClient.invalidateQueries({
          queryKey: ['blogs', 'detail', detailBlogId],
        })
      }
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status'
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBlog,
    onSuccess: (_, blogId) => {
      toast.success('Blog deleted successfully.')
      setSelectedIds(current => current.filter(id => id !== blogId))
      if (detailBlogId === blogId) {
        setDetailBlogId(null)
      }
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete blog'
      )
    },
  })

  const createCommentMutation = useMutation({
    mutationFn: ({
      blogId,
      commentText,
    }: {
      blogId: number
      commentText: string
    }) => createBlogComment(blogId, { comment_text: commentText }),
    onSuccess: (_, variables) => {
      toast.success('Comment posted.')
      setCommentDraft('')
      void queryClient.invalidateQueries({
        queryKey: ['blogs', 'detail', variables.blogId],
      })
      void queryClient.invalidateQueries({
        queryKey: ['blogs', 'comments', variables.blogId],
      })
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to post comment'
      )
    },
  })

  const closeEditorModal = () => {
    if (formCoverPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(formCoverPreview)
    }

    setIsEditorModalOpen(false)
    setEditingBlog(null)
    setFormTitle('')
    setFormHashtags('')
    setFormContent('')
    setFormCoverFile(null)
    setFormCoverPreview(null)
    setRemoveCoverImage(false)
  }

  const openNewModal = () => {
    closeEditorModal()
    setIsEditorModalOpen(true)
  }

  const openEditModal = (blog: Blog) => {
    closeEditorModal()
    setEditingBlog(blog)
    setFormTitle(blog.title)
    setFormHashtags(hashtagsToInput(blog.hashtags))
    setFormContent(blog.content)
    setFormCoverPreview(blog.cover_image_url)
    setIsEditorModalOpen(true)
  }

  const handleFileChange = (file: File | null) => {
    if (formCoverPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(formCoverPreview)
    }

    setFormCoverFile(file)
    setRemoveCoverImage(false)
    setFormCoverPreview(
      file ? URL.createObjectURL(file) : (editingBlog?.cover_image_url ?? null)
    )
  }

  const applyEditorCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    setFormContent(editorRef.current?.innerHTML ?? '')
  }

  const handleSaveBlog = () => {
    const title = formTitle.trim()
    const content = formContent

    if (!title || !hasMeaningfulContent(content)) {
      toast.error('Title and content are required.')
      return
    }

    if (editingBlog) {
      updateMutation.mutate({
        blogId: editingBlog.id,
        payload: {
          title,
          content,
          hashtags: formHashtags,
          coverImageFile: formCoverFile,
          removeCoverImage,
        },
      })
      return
    }

    createMutation.mutate({
      title,
      content,
      hashtags: formHashtags,
      coverImageFile: formCoverFile,
    })
  }

  const handleDeleteBlog = (blogId: number) => {
    const confirmed = window.confirm('Delete this blog record?')
    if (!confirmed) return

    deleteMutation.mutate(blogId)
  }

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('No selected blogs.')
      return
    }

    const confirmed = window.confirm(
      `Delete ${selectedIds.length} selected blog(s)?`
    )
    if (!confirmed) return

    selectedIds.forEach(blogId => {
      deleteMutation.mutate(blogId)
    })
  }

  const handleToggleStatus = (blogId: number) => {
    toggleStatusMutation.mutate(blogId)
  }

  const handleToggleSelect = (blogId: number) => {
    setSelectedIds(current =>
      current.includes(blogId)
        ? current.filter(id => id !== blogId)
        : [...current, blogId]
    )
  }

  const toggleFilter = () => {
    setPage(1)
    setStatusFilter(current => {
      if (current === 'all') return 'active'
      if (current === 'active') return 'inactive'
      return 'all'
    })
  }

  const handleExportCsv = () => {
    if (blogs.length === 0) {
      toast.error('No blog data to export.')
      return
    }

    const headers = [
      'Title',
      'Author',
      'Status',
      'Created At',
      'Views',
      'Comments',
      'Hashtags',
    ]
    const rows = blogs.map(blog => [
      blog.title,
      blog.author?.name ?? 'Unknown',
      blog.is_active ? 'Active' : 'Inactive',
      formatDateTime(blog.created_at),
      String(blog.view_count),
      String(blog.comment_count ?? 0),
      blog.hashtags.map(tag => `#${tag}`).join(' '),
    ])

    const csv = [headers, ...rows]
      .map(row =>
        row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'blogs.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = blogsQuery.data?.total_page ?? 1
  const totalItems = blogsQuery.data?.total_items ?? 0
  const fromItem = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const toItem = Math.min(page * PAGE_SIZE, totalItems)

  const detailBlog = detailQuery.data
  return (
    <div className="flex h-full max-h-screen w-full flex-col overflow-hidden bg-background">
      <div className="flex h-full flex-col overflow-hidden p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-800">Blogs</h1>
            <p className="mt-1 text-lg text-slate-600">
              Share knowledge and insights with the community
            </p>
          </div>

          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-600 px-5 py-3 text-lg font-medium text-white hover:bg-slate-700"
          >
            <Plus className="size-5" />
            New Blog
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={event => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="search......"
              className="w-full rounded-xl border border-slate-200 px-11 py-2.5 text-lg text-slate-700 outline-none focus:border-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-lg text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-5" />
            Excel
          </button>

          <button
            type="button"
            onClick={toggleFilter}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-lg text-slate-700 hover:bg-slate-50"
          >
            <Filter className="size-5" />
            <span className="hidden sm:inline">{statusFilter}</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteSelected}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-lg text-slate-700 hover:bg-slate-50"
          >
            <Trash2 className="size-5" />
          </button>
        </div>

        <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {blogsQuery.isLoading ? (
              <div className="col-span-full rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-5 animate-spin" />
                  Loading blogs...
                </span>
              </div>
            ) : blogs.length > 0 ? (
              blogs.map(blog => {
                const canManage = canManageBlog(
                  blog,
                  currentUser?.id,
                  currentUserRole
                )
                const isSelected = selectedIds.includes(blog.id)

                return (
                  <div
                    key={blog.id}
                    onClick={() => {
                      setDetailBlogId(blog.id)
                      setCommentPage(1)
                      setMenuOpenBlogId(null)
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setDetailBlogId(blog.id)
                        setCommentPage(1)
                        setMenuOpenBlogId(null)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white"
                  >
                    <div className="relative">
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation()
                          handleToggleSelect(blog.id)
                        }}
                        className={`absolute left-3 top-3 z-10 inline-flex size-6 items-center justify-center rounded border ${
                          isSelected
                            ? 'border-slate-600 bg-slate-600 text-white'
                            : 'border-white/80 bg-white/80 text-slate-700'
                        }`}
                        aria-label={`Select blog ${blog.title}`}
                      >
                        {isSelected ? <Check className="size-4" /> : null}
                      </button>

                      {blog.cover_image_url ? (
                        <img
                          src={blog.cover_image_url}
                          alt={blog.title}
                          className="h-64 w-full object-cover"
                        />
                      ) : (
                        <div className="h-64 w-full bg-gradient-to-br from-indigo-950 via-indigo-800 to-blue-700" />
                      )}

                      <div className="absolute right-3 top-3">
                        <button
                          type="button"
                          onClick={event => {
                            event.stopPropagation()
                            setMenuOpenBlogId(current =>
                              current === blog.id ? null : blog.id
                            )
                          }}
                          className="inline-flex size-10 items-center justify-center rounded-full bg-slate-500/70 text-white hover:bg-slate-600"
                          aria-label={`Open actions for ${blog.title}`}
                        >
                          <MoreVertical className="size-5" />
                        </button>

                        {menuOpenBlogId === blog.id ? (
                          <div
                            onClick={event => event.stopPropagation()}
                            onKeyDown={e => {
                              if (e.key === 'Escape') {
                                setMenuOpenBlogId(null)
                              }
                            }}
                            role="menu"
                            tabIndex={-1}
                            className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setDetailBlogId(blog.id)
                                setCommentPage(1)
                                setMenuOpenBlogId(null)
                              }}
                              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              View Details
                            </button>

                            {canManage ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    openEditModal(blog)
                                    setMenuOpenBlogId(null)
                                  }}
                                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  Edit Blog
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleToggleStatus(blog.id)
                                    setMenuOpenBlogId(null)
                                  }}
                                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  {blog.is_active
                                    ? 'Inactive Blog'
                                    : 'Active Blog'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDeleteBlog(blog.id)
                                    setMenuOpenBlogId(null)
                                  }}
                                  className="block w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                                >
                                  Delete Record
                                </button>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-3xl font-medium text-slate-700">
                          {blog.title}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            blog.is_active
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-rose-100 text-rose-600'
                          }`}
                        >
                          {blog.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <p className="text-2xl leading-8 text-slate-600">
                        {getExcerpt(stripHtml(blog.content))}
                      </p>

                      <p className="min-h-7 text-base font-medium text-slate-500">
                        {blog.hashtags.length > 0
                          ? blog.hashtags.map(tag => `#${tag}`).join(' ')
                          : '#blog #learning'}
                      </p>

                      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="size-4" />
                          {blog.author?.name ?? 'Unknown'}
                        </span>

                        <div className="ml-auto flex items-center gap-4">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            {formatDateTime(blog.created_at)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Eye className="size-4" />
                            {blog.view_count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                No blogs found.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 text-lg text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>
            {selectedIds.length} of {blogs.length} row(s) selected.
          </p>

          <div className="flex items-center gap-4">
            <p>
              Showing {fromItem}-{toItem} of {totalItems}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="rounded-full border border-slate-300 p-1 text-slate-500 disabled:opacity-40"
              >
                <ChevronsLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(current => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-full border border-slate-300 p-1 text-slate-500 disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage(current => Math.min(totalPages, current + 1))
                }
                disabled={page >= totalPages}
                className="rounded-full border border-slate-300 p-1 text-slate-500 disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="rounded-full border border-slate-300 p-1 text-slate-500 disabled:opacity-40"
              >
                <ChevronsRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isEditorModalOpen ? (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[95vh] w-full max-w-5xl overflow-auto rounded-xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-3xl font-semibold text-slate-800">
                  {editingBlog ? 'Edit Blog' : 'Create New Blog'}
                </h2>
                <p className="mt-1 text-xl text-slate-400">
                  Fill in the details below to {editingBlog ? 'update' : 'add'}{' '}
                  a blog....
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditorModal}
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
                    handleFileChange(event.target.files?.[0] ?? null)
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
                  onClick={() => {
                    setFormCoverFile(null)
                    setFormCoverPreview(null)
                    setRemoveCoverImage(true)
                  }}
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
                  onChange={event => setFormTitle(event.target.value)}
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
                  onChange={event => setFormHashtags(event.target.value)}
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
                      setFormContent(
                        (event.currentTarget as HTMLDivElement).innerHTML
                      )
                    }
                    className="min-h-[260px] w-full rounded-b-lg px-3 py-2 text-xl text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditorModal}
                  className="rounded-lg border border-slate-200 px-6 py-2 text-2xl text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBlog}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="rounded-lg bg-slate-600 px-10 py-2 text-2xl font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {detailBlogId != null ? (
        <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[95vh] w-full max-w-6xl overflow-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <h2 className="text-4xl font-semibold text-slate-800">
                {detailQuery.isLoading
                  ? 'Loading...'
                  : (detailBlog?.title ?? 'Blog Details')}
              </h2>
              <button
                type="button"
                onClick={() => setDetailBlogId(null)}
                className="rounded-full p-1 text-slate-600 hover:bg-slate-100"
                aria-label="Close details"
              >
                <X className="size-6" />
              </button>
            </div>

            {detailQuery.isLoading ? (
              <div className="py-10 text-center text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle className="size-5 animate-spin" />
                  Loading blog details...
                </span>
              </div>
            ) : detailBlog ? (
              <div className="space-y-4 pt-4">
                {detailBlog.cover_image_url ? (
                  <img
                    src={detailBlog.cover_image_url}
                    alt={detailBlog.title}
                    className="h-[420px] w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-[420px] w-full rounded-lg bg-gradient-to-br from-indigo-950 via-indigo-800 to-blue-700" />
                )}

                <div className="flex items-center justify-end gap-6 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <User className="size-4" />
                    {detailBlog.author?.name ?? 'Unknown'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    {formatDateTime(detailBlog.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="size-4" />
                    {detailBlog.view_count.toLocaleString()}
                  </span>
                </div>

                <article
                  className="space-y-2 text-2xl leading-9 text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichText(detailBlog.content),
                  }}
                />

                <p className="text-2xl font-medium text-slate-600">
                  {detailBlog.hashtags.length > 0
                    ? detailBlog.hashtags.map(tag => `#${tag}`).join(' ')
                    : '#study #techniques'}
                </p>

                <section className="space-y-3 border-t border-slate-200 pt-4">
                  <h3 className="text-2xl font-semibold text-slate-700">
                    Comments
                  </h3>

                  {commentsQuery.isLoading ? (
                    <p className="text-slate-500">Loading comments...</p>
                  ) : (commentsQuery.data?.data.length ?? 0) > 0 ? (
                    commentsQuery.data?.data.map(comment => (
                      <div
                        key={comment.id}
                        className="rounded-lg border border-slate-200 px-3 py-2"
                      >
                        <p className="text-xl text-slate-700">
                          {comment.comment_text}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {comment.commenter?.name ?? 'Unknown'} •{' '}
                          {formatDateTime(comment.created_at)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500">No comments yet.</p>
                  )}

                  <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
                    <button
                      type="button"
                      onClick={() =>
                        setCommentPage(current => Math.max(1, current - 1))
                      }
                      disabled={commentPage <= 1}
                      className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span>
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
                      disabled={
                        commentPage >= (commentsQuery.data?.total_page ?? 1)
                      }
                      className="rounded border border-slate-300 px-2 py-1 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>

                  <textarea
                    value={commentDraft}
                    onChange={event => setCommentDraft(event.target.value)}
                    rows={3}
                    placeholder="Write a comment..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xl text-slate-700 outline-none focus:border-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const value = commentDraft.trim()
                      if (!value) {
                        toast.error('Please write a comment first.')
                        return
                      }

                      createCommentMutation.mutate({
                        blogId: detailBlog.id,
                        commentText: value,
                      })
                    }}
                    disabled={createCommentMutation.isPending}
                    className="rounded-lg bg-slate-600 px-4 py-2 text-lg text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {createCommentMutation.isPending
                      ? 'Posting...'
                      : 'Post Comment'}
                  </button>
                </section>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-500">
                Unable to load blog detail.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
