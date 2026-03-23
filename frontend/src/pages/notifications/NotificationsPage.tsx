import { createElement, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mail,
} from 'lucide-react'
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useUnreadCount,
} from '@/features/notifications'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import type { Notification, NotificationType } from '@/features/notifications'

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'new_schedule_assigned':
      return Calendar
    case 'new_message':
      return Mail
    case 'blog_post_published':
      return FileText
    case 'system_update':
      return AlertTriangle
    default:
      return FileText
  }
}

function getNotificationIconColor(type: NotificationType): string {
  switch (type) {
    case 'new_schedule_assigned':
      return 'bg-blue-100 text-blue-600'
    case 'new_message':
      return 'bg-green-100 text-green-600'
    case 'blog_post_published':
      return 'bg-purple-100 text-purple-600'
    case 'system_update':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) {
    return diffMins <= 1 ? '1 hour ago' : `${diffMins} hour ago`
  }
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hour ago`
  }
  if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  }
  return date.toLocaleDateString()
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const navigate = useNavigate()
  const iconColor = getNotificationIconColor(notification.type)

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id)
    }

    if (notification.action?.route) {
      if (notification.action.conversation_id) {
        navigate({
          pathname: notification.action.route,
          search: `?conversation=${notification.action.conversation_id}`,
        })
      } else {
        navigate(notification.action.route)
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-4 rounded-xl bg-background px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/40',
        notification.is_read
          ? 'border border-slate-200 dark:border-slate-700'
          : 'border border-blue-500 dark:border-blue-500/60'
      )}
    >
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-lg',
          iconColor
        )}
      >
        {createElement(getNotificationIcon(notification.type), {
          className: 'size-5',
        })}
      </div>
      <div className="min-w-0 flex-1 pr-2">
        <h3 className="text-[15px] font-semibold leading-snug text-slate-900 dark:text-slate-100">
          {notification.title || 'Notification'}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {notification.body || 'No description available.'}
        </p>
      </div>
      <span className="shrink-0 pt-0.5 text-right text-xs font-normal tabular-nums text-slate-400 dark:text-slate-500">
        {formatTimeAgo(notification.created_at)}
      </span>
    </button>
  )
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] =
    useState<(typeof ROWS_PER_PAGE_OPTIONS)[number]>(10)

  const { data, isLoading } = useNotifications(currentPage, perPage)
  const { data: unreadCountData } = useUnreadCount()
  const { mutate: markAsRead } = useMarkAsRead()
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } =
    useMarkAllAsRead()

  const notifications = data?.data ?? []
  const totalItems = data?.total_items ?? 0
  const totalPages = Math.max(1, data?.total_page ?? 1)
  const totalUnreadCount = unreadCountData?.count ?? 0

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter(n => !n.is_read)
      : notifications

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl bg-white">
        <div className="px-3 pb-0 pt-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Notifications
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Stay updated with your latest activities
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead || totalUnreadCount === 0}
              isLoading={isMarkingAllAsRead}
              className="h-9 shrink-0 rounded-lg bg-slate-700 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              Mark All as Read
            </Button>
          </div>

          <div className="mt-8 flex gap-4 border-b border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                'relative px-3 pb-3.5 text-[15px] text-sm font-medium transition-colors',
                activeTab === 'all'
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              All Notifications ({totalItems})
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t bg-black" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={cn(
                'relative px-3 pb-3.5 text-[15px] text-sm font-medium transition-colors',
                activeTab === 'unread'
                  ? 'text-slate-900'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Unread ({totalUnreadCount})
              {activeTab === 'unread' && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t bg-black" />
              )}
            </button>
          </div>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <EmptyState
              title="No notifications"
              description={
                activeTab === 'unread'
                  ? 'You have no unread notifications'
                  : 'You have no notifications yet'
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
          )}

          {!isLoading && filteredNotifications.length > 0 && totalItems > 0 && (
            <div className="mt-8 flex flex-col gap-4 pt-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-slate-600 dark:text-slate-400">
                  Rows per page:
                </span>
                <div className="relative inline-flex items-center">
                  <select
                    id="notifications-rows-per-page"
                    aria-label="Rows per page"
                    value={perPage}
                    onChange={e => {
                      setPerPage(
                        Number(
                          e.target.value
                        ) as (typeof ROWS_PER_PAGE_OPTIONS)[number]
                      )
                      setCurrentPage(1)
                    }}
                    className="h-9 min-w-[4.5rem] cursor-pointer appearance-none rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-9 text-sm font-medium text-slate-800 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500"
                  >
                    {ROWS_PER_PAGE_OPTIONS.map(n => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-5 sm:gap-8">
                <span className="tabular-nums text-slate-600 dark:text-slate-400">
                  {(currentPage - 1) * perPage + 1}-
                  {Math.min(currentPage * perPage, totalItems)} of {totalItems}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="rounded p-1.5 text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-5" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage(p => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage >= totalPages}
                    className="rounded p-1.5 text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
