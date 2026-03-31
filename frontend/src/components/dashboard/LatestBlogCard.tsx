import { Link } from 'react-router-dom'
import { Calendar, Eye, MessageCircle, User } from 'lucide-react'
import type { LatestBlogPost } from '@/api/analytics'

const FALLBACK_SVG =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="%235B8FF9" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E'

function formatBlogDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${y}/${m}/${day} ${time}`
}

function formatViewCount(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

type LatestBlogCardProps = {
  blog: LatestBlogPost
}

export function LatestBlogCard({ blog }: LatestBlogCardProps) {
  return (
    <Link
      to={`/blogs?blog=${blog.id}`}
      className="flex min-w-0 flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/40 sm:flex-row sm:items-center"
    >
      <img
        src={blog.coverImageUrl ?? './assets/blog_placeholder_view.png'}
        alt=""
        className="h-36 w-full shrink-0 rounded-lg object-cover sm:h-auto sm:w-40"
        onError={e => {
          e.currentTarget.src = FALLBACK_SVG
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <h4 className="line-clamp-2 font-semibold text-gray-900">
          {blog.title}
        </h4>
        <p className="mt-1 line-clamp-3 text-sm text-gray-600">
          {blog.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {blog.tags.map((tag, index) => (
            <span
              key={index}
              className="text-xs font-medium text-slate-500 sm:text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 sm:text-sm">
          <span className="flex min-w-0 items-center gap-1.5">
            <User className="size-3.5 shrink-0 text-gray-400 sm:size-4" />
            <span className="truncate">{blog.author?.name ?? '—'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5 shrink-0 text-gray-400 sm:size-4" />
            {formatBlogDateTime(blog.created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-3.5 shrink-0 text-gray-400 sm:size-4" />
            {formatViewCount(blog.viewCount)}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageCircle className="size-3.5 shrink-0 text-gray-400 sm:size-4" />
            {blog.commentCount}
          </span>
        </div>
      </div>
    </Link>
  )
}
