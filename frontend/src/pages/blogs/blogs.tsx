import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { Blog } from '@/features/blogs/api'
import { getUserRole } from '@/features/auth/role-utils'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import {
  BlogDetailModal,
  BlogEditorModal,
  BlogFilters,
  BlogGrid,
  BlogListPagination,
} from '@/components/blogs'
import { ConfirmDialog } from '@/components/ui'
import { buildCsv, formatDateTimeShort } from '@/utils/formatters'
import { BLOGS_PAGE_SIZE, useBlogList } from './useBlogList'
import { useBlogActions } from './useBlogActions'

type DeleteTarget =
  | { type: 'single'; blogId: number }
  | { type: 'bulk'; blogIds: number[] }
  | null
type ToggleStatusTarget = { blogId: number; currentlyActive: boolean } | null

export function BlogsPage() {
  const { data: currentUser } = useCurrentUser()
  const currentUserRole = getUserRole(currentUser)
  const canManageBlogs = currentUserRole === 'staff'

  const [searchParams, setSearchParams] = useSearchParams()

  const detailBlogId = useMemo(() => {
    const raw = searchParams.get('blog')
    if (raw == null || raw === '') return null
    const id = Number.parseInt(raw, 10)
    return Number.isFinite(id) && id > 0 ? id : null
  }, [searchParams])

  const openBlogDetail = (blogId: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('blog', String(blogId))
      return next
    })
  }

  const closeBlogDetail = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('blog')
      return next
    })
  }

  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)
  const [toggleStatusTarget, setToggleStatusTarget] =
    useState<ToggleStatusTarget>(null)

  const {
    blogs,
    isLoading,
    page,
    setPage,
    search,
    statusFilter,
    totalPages,
    totalItems,
    handleSearchChange,
    handleStatusFilterChange,
  } = useBlogList(canManageBlogs)

  const actions = useBlogActions({
    onCreateSuccess: () => {
      setEditorOpen(false)
      setPage(1)
    },
    onUpdateSuccess: () => {
      setEditorOpen(false)
      setEditingBlog(null)
    },
    onDeleteSuccess: blogId => {
      setSelectedIds(ids => ids.filter(id => id !== blogId))
      if (detailBlogId === blogId) {
        closeBlogDetail()
      }
    },
  })

  const openNewEditor = () => {
    setEditingBlog(null)
    setEditorOpen(true)
  }

  const openEditEditor = (blog: Blog) => {
    setEditingBlog(blog)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingBlog(null)
  }

  const handleToggleSelect = (blogId: number) => {
    setSelectedIds(ids =>
      ids.includes(blogId) ? ids.filter(id => id !== blogId) : [...ids, blogId]
    )
  }

  const handleRequestDelete = (blogId: number) => {
    setDeleteTarget({ type: 'single', blogId })
  }

  const handleRequestDeleteSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('No selected blogs.')
      return
    }
    setDeleteTarget({ type: 'bulk', blogIds: [...selectedIds] })
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return

    if (deleteTarget.type === 'single') {
      actions.handleDelete(deleteTarget.blogId)
    } else {
      deleteTarget.blogIds.forEach(blogId => {
        actions.handleDelete(blogId)
      })
    }
    setDeleteTarget(null)
  }

  const handleCancelDelete = () => {
    setDeleteTarget(null)
  }

  const handleRequestActivateBlog = (blogId: number) => {
    const blog = blogs.find(b => b.id === blogId)
    if (blog && !blog.is_active) {
      setToggleStatusTarget({ blogId, currentlyActive: false })
    }
  }

  const handleRequestDeactivateBlog = (blogId: number) => {
    const blog = blogs.find(b => b.id === blogId)
    if (blog && blog.is_active) {
      setToggleStatusTarget({ blogId, currentlyActive: true })
    }
  }

  const handleConfirmToggleStatus = () => {
    if (!toggleStatusTarget) return
    actions.handleToggleStatus(toggleStatusTarget.blogId)
    setToggleStatusTarget(null)
  }

  const handleCancelToggleStatus = () => {
    setToggleStatusTarget(null)
  }

  const handleExportCsv = () => {
    if (blogs.length === 0) {
      toast.error('No blog data to export.')
      return
    }

    const rows: unknown[][] = [
      [
        'Title',
        'Author',
        'Status',
        'Created At',
        'Views',
        'Comments',
        'Hashtags',
      ],
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

  return (
    <div className="flex h-full max-h-screen w-full flex-col overflow-hidden bg-background">
      <div className="flex h-full flex-col overflow-hidden">
        <BlogFilters
          search={search}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onExportCsv={handleExportCsv}
          onDeleteSelected={handleRequestDeleteSelected}
          onNewBlog={openNewEditor}
          hasSelection={selectedIds.length > 0}
          canManageBlogs={canManageBlogs}
        />

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto sm:mt-8">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            <BlogGrid
              blogs={blogs}
              isLoading={isLoading}
              currentUserId={currentUser?.id}
              currentUserRole={currentUserRole}
              selectedIds={selectedIds}
              onOpenDetail={openBlogDetail}
              onToggleSelect={handleToggleSelect}
              onViewDetails={openBlogDetail}
              onEdit={openEditEditor}
              onActivateBlog={handleRequestActivateBlog}
              onDeactivateBlog={handleRequestDeactivateBlog}
              onDelete={handleRequestDelete}
            />
          </div>
        </div>

        <BlogListPagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={BLOGS_PAGE_SIZE}
          selectedCount={selectedIds.length}
          visibleCount={blogs.length}
          onPageChange={setPage}
          canManageBlogs={canManageBlogs}
        />
      </div>

      <BlogEditorModal
        isOpen={editorOpen}
        onClose={closeEditor}
        editingBlog={editingBlog}
        onSave={data => actions.handleSave(data, editingBlog?.id)}
        isSaving={actions.isSaving}
      />

      <BlogDetailModal blogId={detailBlogId} onClose={closeBlogDetail} />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={
          deleteTarget?.type === 'bulk'
            ? `Delete ${deleteTarget.blogIds.length} blog(s)?`
            : 'Delete blog?'
        }
        description={
          deleteTarget?.type === 'bulk'
            ? 'This will permanently delete all selected blogs. This action cannot be undone.'
            : 'This will permanently delete this blog post. This action cannot be undone.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={actions.isDeleting}
      />

      <ConfirmDialog
        isOpen={toggleStatusTarget !== null}
        onClose={handleCancelToggleStatus}
        onConfirm={handleConfirmToggleStatus}
        title={
          toggleStatusTarget?.currentlyActive
            ? 'Inactive Blog?'
            : 'Active Blog?'
        }
        description={
          toggleStatusTarget?.currentlyActive
            ? 'This blog will no longer be visible to users. You can reactivate it later.'
            : 'This blog will become visible to users.'
        }
        confirmLabel={
          toggleStatusTarget?.currentlyActive ? 'Inactive Blog' : 'Active Blog'
        }
        cancelLabel="Cancel"
        variant={toggleStatusTarget?.currentlyActive ? 'inactive' : 'success'}
        isLoading={actions.isTogglingStatus}
      />
    </div>
  )
}
