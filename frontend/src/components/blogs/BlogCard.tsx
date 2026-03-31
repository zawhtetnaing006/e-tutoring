import {
  Calendar,
  Check,
  Edit,
  Eye,
  MoreVertical,
  Power,
  Trash2,
  User,
} from 'lucide-react'
import type { Blog } from '@/features/blogs/api'
import { Dropdown, DropdownItem } from '@/components/ui'
import { formatDateTimeShort } from '@/utils/formatters'
import { getExcerpt, stripHtml } from '@/utils/string'
import { BLOG_STATUS_STYLES } from './types'

export interface BlogCardProps {
  blog: Blog
  canManage: boolean
  isSelected: boolean
  onOpenDetail: () => void
  onToggleSelect: (event: React.MouseEvent) => void
  onViewDetails: () => void
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
}

export function BlogCard({
  blog,
  canManage,
  isSelected,
  onOpenDetail,
  onToggleSelect,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onDelete,
}: BlogCardProps) {
  const isToolbarTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    target.closest('[data-blog-card-toolbar]') !== null

  const handleCardClick = (e: React.MouseEvent) => {
    if (isToolbarTarget(e.target)) return
    onOpenDetail()
  }

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    if (isToolbarTarget(e.target)) return
    e.preventDefault()
    onOpenDetail()
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: Clickable card pattern
    <div
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="relative">
        {canManage ? (
          <button
            type="button"
            onClick={onToggleSelect}
            className={`absolute left-3 top-3 z-10 inline-flex size-6 items-center justify-center rounded border transition-opacity ${
              isSelected
                ? 'border-slate-600 bg-slate-600 text-white opacity-100'
                : 'border-white/80 bg-white/80 text-slate-700 opacity-0 group-hover:opacity-100'
            }`}
            aria-label={`Select blog ${blog.title}`}
          >
            {isSelected ? <Check className="size-4" /> : null}
          </button>
        ) : null}

        {blog.cover_image_url ? (
          <img
            src={blog.cover_image_url}
            alt={blog.title}
            className="h-40 w-full object-cover sm:h-52 md:h-64"
          />
        ) : (
          <div className="h-40 w-full bg-gradient-to-br from-indigo-950 via-indigo-800 to-blue-700 sm:h-52 md:h-64" />
        )}

        <div className="absolute right-3 top-3" data-blog-card-toolbar>
          {canManage ? (
            <Dropdown
              trigger={
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-slate-500/70 text-white hover:bg-slate-600">
                  <MoreVertical className="size-5" />
                </span>
              }
              align="right"
            >
              <DropdownItem
                icon={<Eye className="size-4" />}
                onClick={onViewDetails}
              >
                View Details
              </DropdownItem>

              <DropdownItem icon={<Edit className="size-4" />} onClick={onEdit}>
                Edit Blog
              </DropdownItem>

              <DropdownItem
                icon={<Power className="size-4" />}
                onClick={onToggleStatus}
              >
                {blog.is_active ? 'Deactivate' : 'Activate'}
              </DropdownItem>

              <DropdownItem
                icon={<Trash2 className="size-4" />}
                onClick={onDelete}
                variant="danger"
              >
                Delete
              </DropdownItem>
            </Dropdown>
          ) : (
            <button
              type="button"
              onClick={onViewDetails}
              className="inline-flex size-10 items-center justify-center rounded-full bg-slate-500/70 text-white hover:bg-slate-600"
              aria-label="View blog details"
            >
              <Eye className="size-5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:items-center sm:gap-3">
          <h3 className="line-clamp-2 text-sm font-medium text-slate-700">
            {blog.title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium sm:px-3 sm:py-1 sm:text-sm ${
              blog.is_active
                ? BLOG_STATUS_STYLES.active
                : BLOG_STATUS_STYLES.inactive
            }`}
          >
            {blog.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <p className="line-clamp-3 text-xs leading-6 text-slate-600 sm:leading-8">
          {getExcerpt(stripHtml(blog.content))}
        </p>

        <p className="line-clamp-1 min-h-5 text-xs font-medium text-slate-500 sm:min-h-7">
          {blog.hashtags.length > 0
            ? blog.hashtags.map(tag => `#${tag}`).join(' ')
            : '#blog #learning'}
        </p>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 text-slate-500 sm:justify-between sm:gap-3 sm:pt-3">
          <span className="inline-flex items-center gap-1 text-[10px] sm:gap-1.5">
            <User className="size-3 sm:size-4" />
            <span className="max-w-[80px] truncate sm:max-w-none">
              {blog.author?.name ?? 'Unknown'}
            </span>
          </span>

          <div className="ml-auto flex items-center gap-2 text-[10px] sm:gap-4">
            <span className="hidden items-center gap-1 xs:inline-flex sm:gap-1.5">
              <Calendar className="size-3 sm:size-3.5" />
              {formatDateTimeShort(blog.created_at)}
            </span>
            <span className="inline-flex items-center gap-1 sm:gap-1.5">
              <Eye className="size-3 sm:size-3.5" />
              {blog.view_count.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
