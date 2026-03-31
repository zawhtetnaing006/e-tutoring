import { FileText } from 'lucide-react'
import type { Blog } from '@/features/blogs/api'
import { EmptyState, LoadingSpinner } from '@/components/ui'
import { BlogCard } from './BlogCard'
import { canManageBlog } from './utils'

export interface BlogGridProps {
  blogs: Blog[]
  isLoading: boolean
  currentUserId: number | undefined
  currentUserRole: 'staff' | 'tutor' | 'student'
  selectedIds: number[]
  onOpenDetail: (blogId: number) => void
  onToggleSelect: (blogId: number, event: React.MouseEvent) => void
  onViewDetails: (blogId: number) => void
  onEdit: (blog: Blog) => void
  onToggleStatus: (blogId: number) => void
  onDelete: (blogId: number) => void
}

export function BlogGrid({
  blogs,
  isLoading,
  currentUserId,
  currentUserRole,
  selectedIds,
  onOpenDetail,
  onToggleSelect,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onDelete,
}: BlogGridProps) {
  if (isLoading) {
    return (
      <div className="col-span-full flex items-center justify-center rounded-xl border border-slate-200 p-8">
        <LoadingSpinner size="md" className="text-slate-500" />
        <span className="ml-2 text-slate-500">Loading blogs...</span>
      </div>
    )
  }

  if (blogs.length === 0) {
    return (
      <div className="col-span-full">
        <EmptyState
          icon={<FileText className="size-12" />}
          title="No blogs found"
          description="Try adjusting your search or filters"
          className="rounded-xl border border-slate-200"
        />
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
          onOpenDetail={() => {
            onOpenDetail(blog.id)
          }}
          onToggleSelect={event => onToggleSelect(blog.id, event)}
          onViewDetails={() => onViewDetails(blog.id)}
          onEdit={() => onEdit(blog)}
          onToggleStatus={() => onToggleStatus(blog.id)}
          onDelete={() => onDelete(blog.id)}
        />
      ))}
    </>
  )
}
