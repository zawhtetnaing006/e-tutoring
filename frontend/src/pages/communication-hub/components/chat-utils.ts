import type { ChatConversation } from '@/features/chat/api'

export function formatMessageTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRelative(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  if (Number.isNaN(diffMs)) return ''

  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function getConversationPeer(
  conversation: ChatConversation,
  currentUserId: number | undefined
) {
  return currentUserId === conversation.tutor_user_id
    ? conversation.student
    : conversation.tutor
}

export function getConversationPreview(conversation: ChatConversation) {
  if (conversation.last_message?.content) {
    return conversation.last_message.content
  }

  return `Semester: ${conversation.start_date} - ${conversation.end_date}`
}
