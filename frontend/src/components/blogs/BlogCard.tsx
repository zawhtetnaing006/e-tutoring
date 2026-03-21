import { Calendar, Check, Eye, MoreVertical, User } from 'lucide-react'
import type { Blog } from '@/features/blogs/api'
import { formatDateTimeShort } from '@/utils/formatters'
import { getExcerpt, stripHtml } from '@/utils/string'

export interface BlogCardProps {
  blog: Blog
  canManage: boolean
  isSelected: boolean
  isMenuOpen: boolean
  onOpenDetail: () => void
  onToggleSelect: (event: React.MouseEvent) => void
  onToggleMenu: (event: React.MouseEvent) => void
  onViewDetails: () => void
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
  onMenuEscape: () => void
}

export function BlogCard({
  blog,
  canManage,
  isSelected,
  isMenuOpen,
  onOpenDetail,
  onToggleSelect,
  onToggleMenu,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onDelete,
  onMenuEscape,
}: BlogCardProps) {
  return (
    <div
      onClick={onOpenDetail}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenDetail()
        }
      }}
      role="button"
      tabIndex={0}
      className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="relative">
        <button
          type="button"
          onClick={onToggleSelect}
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
            onClick={onToggleMenu}
            className="inline-flex size-10 items-center justify-center rounded-full bg-slate-500/70 text-white hover:bg-slate-600"
            aria-label={`Open actions for ${blog.title}`}
          >
            <MoreVertical className="size-5" />
          </button>

          {isMenuOpen ? (
            <div
              onClick={event => event.stopPropagation()}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  onMenuEscape()
                }
              }}
              role="menu"
              tabIndex={-1}
              className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                onClick={onViewDetails}
                className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                View Details
              </button>

              {canManage ? (
                <>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Edit Blog
                  </button>

                  <button
                    type="button"
                    onClick={onToggleStatus}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {blog.is_active ? 'Inactive Blog' : 'Active Blog'}
                  </button>

                  <button
                    type="button"
                    onClick={onDelete}
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
          <h3 className="text-3xl font-medium text-slate-700">{blog.title}</h3>
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
              {formatDateTimeShort(blog.created_at)}
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
}
