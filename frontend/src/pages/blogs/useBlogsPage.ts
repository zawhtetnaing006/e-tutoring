import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
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
import type { StatusFilter } from '@/components/blogs'
import { buildCsv, formatDateTimeShort } from '@/utils/formatters'
import {
  hasMeaningfulContent,
  hashtagsToInput,
  parsePositiveIntParam,
} from '@/utils/string'

export const BLOGS_PAGE_SIZE = 9

export function useBlogsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
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

  const [commentDraft, setCommentDraft] = useState('')
  const [commentPage, setCommentPage] = useState(1)

  const detailBlogId = useMemo(
    () => parsePositiveIntParam(searchParams.get('blog')),
    [searchParams]
  )

  const setDetailBlogId = useCallback(
    (id: number | null) => {
      if (id == null) {
        setCommentDraft('')
        setSearchParams(
          prev => {
            const next = new URLSearchParams(prev)
            next.delete('blog')
            return next
          },
          { replace: true }
        )
        return
      }
      setCommentPage(1)
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev)
          next.set('blog', String(id))
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const debouncedSearch = useDebouncedValue(search.trim(), 350)

  const blogsQuery = useBlogs({
    page,
    perPage: BLOGS_PAGE_SIZE,
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

  const closeDetailModal = () => {
    setDetailBlogId(null)
  }

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
    const rows: unknown[][] = [
      headers,
      ...blogs.map(blog => [
        blog.title,
        blog.author?.name ?? 'Unknown',
        blog.is_active ? 'Active' : 'Inactive',
        formatDateTimeShort(blog.created_at),
        String(blog.view_count),
        String(blog.comment_count ?? 0),
        blog.hashtags.map(tag => `#${tag}`).join(' '),
      ]),
    ]

    const csv = buildCsv(rows)

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

  const detailBlog = detailQuery.data
  const comments = commentsQuery.data?.data ?? []
  const commentsTotalPages = commentsQuery.data?.total_page ?? 1

  const handlePostComment = () => {
    const value = commentDraft.trim()
    if (!value) {
      toast.error('Please write a comment first.')
      return
    }
    if (!detailBlog) return
    createCommentMutation.mutate({
      blogId: detailBlog.id,
      commentText: value,
    })
  }

  const handleRemoveCover = () => {
    setFormCoverFile(null)
    setFormCoverPreview(null)
    setRemoveCoverImage(true)
  }

  return {
    currentUser,
    currentUserRole,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    selectedIds,
    menuOpenBlogId,
    setMenuOpenBlogId,
    isEditorModalOpen,
    editingBlog,
    formTitle,
    setFormTitle,
    formHashtags,
    setFormHashtags,
    formContent,
    setFormContent,
    formCoverPreview,
    editorRef,
    detailBlogId,
    setDetailBlogId,
    closeDetailModal,
    commentDraft,
    setCommentDraft,
    commentPage,
    setCommentPage,
    blogsQuery,
    blogs,
    detailQuery,
    detailBlog,
    commentsQuery,
    comments,
    commentsTotalPages,
    totalPages,
    totalItems,
    createMutation,
    updateMutation,
    createCommentMutation,
    closeEditorModal,
    openNewModal,
    openEditModal,
    handleFileChange,
    applyEditorCommand,
    handleSaveBlog,
    handleDeleteBlog,
    handleDeleteSelected,
    handleToggleStatus,
    handleToggleSelect,
    toggleFilter,
    handleExportCsv,
    handlePostComment,
    handleRemoveCover,
  }
}
