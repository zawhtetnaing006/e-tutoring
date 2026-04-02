import { createSearchParams } from 'react-router-dom'
import type { NotificationAction } from '@/features/notifications/types'

/** Builds the `search` string for navigating to a notification's `action.route`. */
export function buildNotificationActionSearch(
  action: NotificationAction
): string | undefined {
  if (action.query && Object.keys(action.query).length > 0) {
    return `?${createSearchParams(
      Object.fromEntries(
        Object.entries(action.query).map(([k, v]) => [k, String(v)])
      )
    ).toString()}`
  }
  if (action.conversation_id != null) {
    return `?${createSearchParams({
      conversation: String(action.conversation_id),
    }).toString()}`
  }
  return undefined
}
