import type { Blog } from '@/features/blogs/api'
import { LoadingSpinner } from '@/components/ui'
import { BlogCard } from './BlogCard'
import { canManageBlog } from './utils'

export interface BlogGridProps {
  blogs: Blog[]
  isLoading: boolean
  menuOpenBlogId: number | null
  currentUserId: number | undefined
  currentUserRole: 'staff' | 'tutor' | 'student'
  selectedIds: number[]
  onOpenDetail: (blogId: number) => void
  onToggleSelect: (blogId: number, event: React.MouseEvent) => void
  onToggleMenu: (blogId: number, event: React.MouseEvent) => void
  onViewDetails: (blogId: number) => void
  onEdit: (blog: Blog) => void
  onToggleStatus: (blogId: number) => void
  onDelete: (blogId: number) => void
  onMenuEscape: () => void
}

export function BlogGrid({
  blogs,
  isLoading,
  menuOpenBlogId,
  currentUserId,
  currentUserRole,
  selectedIds,
  onOpenDetail,
  onToggleSelect,
  onToggleMenu,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onDelete,
  onMenuEscape,
}: BlogGridProps) {
  if (isLoading) {
    return (
      <div className="col-span-full rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        <span className="inline-flex items-center gap-2">
          <LoadingSpinner size="md" className="text-slate-500" />
          Loading blogs...
        </span>
      </div>
    )
  }

  if (blogs.length === 0) {
    return (
      <div className="col-span-full rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No blogs found.
      </div>
    )
  }

  return (
    <>
      {blogs.map(blog => (
        <BlogCard
          key={blog.id}
          blog={blog}
          canManage={canManageBlog(blog, currentUserId, currentUserRole)}
          isSelected={selectedIds.includes(blog.id)}
          isMenuOpen={menuOpenBlogId === blog.id}
          onOpenDetail={() => {
            onOpenDetail(blog.id)
          }}
          onToggleSelect={event => onToggleSelect(blog.id, event)}
          onToggleMenu={event => onToggleMenu(blog.id, event)}
          onViewDetails={() => onViewDetails(blog.id)}
          onEdit={() => onEdit(blog)}
          onToggleStatus={() => onToggleStatus(blog.id)}
          onDelete={() => onDelete(blog.id)}
          onMenuEscape={onMenuEscape}
        />
      ))}
    </>
  )
}
