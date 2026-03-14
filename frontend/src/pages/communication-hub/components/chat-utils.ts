import type { ChatConversation, ChatUser } from '@/features/chat/api'

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
  const fallbackPeer: ChatUser = {
    id: -1,
    name: 'Unknown user',
    email: '',
    roles: [],
  }

  if (conversation.members.length === 0) return fallbackPeer
  if (conversation.members.length === 1) return conversation.members[0]

  return (
    conversation.members.find(member => member.id !== currentUserId) ??
    conversation.members[0] ??
    fallbackPeer
  )
}

export function getConversationPreview(conversation: ChatConversation) {
  if (conversation.last_message?.content) {
    return conversation.last_message.content
  }

  return 'No messages yet'
}

export function formatChatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatFileSize(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  const precision = size >= 10 || unitIndex === 0 ? 0 : 1
  return `${size.toFixed(precision)} ${units.at(unitIndex) ?? 'B'}`
}

export function getChatUserRoleLabel(user: Pick<ChatUser, 'roles'>) {
  const normalizedRoles = user.roles.map(role => role.trim().toUpperCase())

  if (normalizedRoles.includes('ADMIN') || normalizedRoles.includes('STAFF')) {
    return 'Staff'
  }

  if (normalizedRoles.includes('TUTOR')) {
    return 'Tutor'
  }

  if (normalizedRoles.includes('STUDENT')) {
    return 'Student'
  }

  return 'User'
}
