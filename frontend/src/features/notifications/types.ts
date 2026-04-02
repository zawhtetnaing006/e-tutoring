export type NotificationType =
  | 'new_schedule_assigned'
  | 'new_message'
  | 'blog_post_published'
  | 'system_update'
  | string

export interface NotificationAction {
  route?: string
  /** Query string params for the target route (e.g. `{ conversation: 1 }`). */
  query?: Record<string, string | number | boolean>
  conversation_id?: number
}

export interface Notification {
  id: string
  type: NotificationType
  is_read: boolean
  created_at: string
  title: string | null
  body: string | null
  action?: NotificationAction | null
}

export interface NotificationsListResponse {
  data: Notification[]
  current_page: number
  total_page: number
  total_items: number
}

export interface UnreadCountResponse {
  count: number
}

export interface MarkAllAsReadResponse {
  message: string
  marked_count: number
}
