import type { InfiniteData } from '@tanstack/react-query'
import type {
  ChatConversation,
  ChatMessage,
  PaginatedResponse,
} from '@/features/chat/api'

export function createOptimisticMessagesState(
  message: ChatMessage
): InfiniteData<PaginatedResponse<ChatMessage>> {
  return {
    pages: [
      {
        data: [message],
        current_page: 1,
        total_page: 1,
        total_items: 1,
      },
    ],
    pageParams: [1],
  }
}

export function addMessageToCache(
  current: InfiniteData<PaginatedResponse<ChatMessage>> | undefined,
  message: ChatMessage
): InfiniteData<PaginatedResponse<ChatMessage>> {
  if (!current || current.pages.length === 0) {
    return createOptimisticMessagesState(message)
  }

  const alreadyExists = current.pages.some(page =>
    page.data.some(existingMessage => existingMessage.id === message.id)
  )
  if (alreadyExists) {
    return current
  }

  return {
    ...current,
    pages: current.pages.map((page, pageIndex) => ({
      ...page,
      data: pageIndex === 0 ? [message, ...page.data] : page.data,
      total_items: page.total_items + 1,
    })),
  }
}

export function removeMessageFromCache(
  current: InfiniteData<PaginatedResponse<ChatMessage>> | undefined,
  messageId: number
): InfiniteData<PaginatedResponse<ChatMessage>> | undefined {
  if (!current) {
    return current
  }

  const hasMessage = current.pages.some(page =>
    page.data.some(message => message.id === messageId)
  )

  if (!hasMessage) {
    return current
  }

  return {
    ...current,
    pages: current.pages.map(page => ({
      ...page,
      data: page.data.filter(message => message.id !== messageId),
      total_items: Math.max(0, page.total_items - 1),
    })),
  }
}

export function replaceMessageInCache(
  current: InfiniteData<PaginatedResponse<ChatMessage>> | undefined,
  optimisticMessageId: number,
  message: ChatMessage
): InfiniteData<PaginatedResponse<ChatMessage>> | undefined {
  if (!current) {
    return current
  }

  const realMessageExists = current.pages.some(page =>
    page.data.some(existingMessage => existingMessage.id === message.id)
  )

  if (realMessageExists) {
    return removeMessageFromCache(current, optimisticMessageId)
  }

  let replaced = false

  const pages = current.pages.map(page => ({
    ...page,
    data: page.data.map(existingMessage => {
      if (existingMessage.id !== optimisticMessageId) {
        return existingMessage
      }

      replaced = true
      return message
    }),
  }))

  return replaced
    ? {
        ...current,
        pages,
      }
    : addMessageToCache(current, message)
}

export function updateConversationSeenState(
  current: InfiniteData<PaginatedResponse<ChatConversation>> | undefined,
  receipt: {
    conversation_id: number
    user_id: number
    last_seen_message_id: number | null
    seen_at: string | null
  },
  currentUserId: number | undefined
): InfiniteData<PaginatedResponse<ChatConversation>> | undefined {
  if (!current) {
    return current
  }

  return {
    ...current,
    pages: current.pages.map(page => ({
      ...page,
      data: page.data.map(conversation => {
        if (conversation.id !== receipt.conversation_id) {
          return conversation
        }

        if (receipt.user_id === currentUserId) {
          return {
            ...conversation,
            current_user_last_seen_message_id: receipt.last_seen_message_id,
          }
        }

        return {
          ...conversation,
          other_user_last_seen_message_id: receipt.last_seen_message_id,
          other_user_seen_at: receipt.seen_at,
        }
      }),
    })),
  }
}
