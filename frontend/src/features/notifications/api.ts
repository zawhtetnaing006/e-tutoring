import { apiClient } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'
import type {
  NotificationsListResponse,
  UnreadCountResponse,
  MarkAllAsReadResponse,
  Notification,
} from './types'

export async function getNotifications(params: {
  page?: number
  per_page?: number
}): Promise<NotificationsListResponse> {
  const session = getAuthSession()
  const searchParams = new URLSearchParams()

  if (params.page) searchParams.append('page', params.page.toString())
  if (params.per_page)
    searchParams.append('per_page', params.per_page.toString())

  const query = searchParams.toString()
  const url = query ? `/notifications?${query}` : '/notifications'

  return apiClient<NotificationsListResponse>(url, {
    method: 'GET',
    token: session?.token,
  })
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const session = getAuthSession()
  return apiClient<UnreadCountResponse>('/notifications/unread-count', {
    method: 'GET',
    token: session?.token,
  })
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<Notification> {
  const session = getAuthSession()
  return apiClient<Notification>(`/notifications/${notificationId}/read`, {
    method: 'POST',
    token: session?.token,
  })
}

export async function markAllNotificationsAsRead(): Promise<MarkAllAsReadResponse> {
  const session = getAuthSession()
  return apiClient<MarkAllAsReadResponse>('/notifications/read-all', {
    method: 'POST',
    token: session?.token,
  })
}
