import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

type ChatUser = {
  id: number
  name: string
}

export type ChatMessage = {
  id: number
  conversation_id: number
  sender_id: number
  sender_name: string
  content: string
  created_at: string
  updated_at: string
}

export type ChatConversation = {
  id: number
  tutor_user_id: number
  student_user_id: number
  start_date: string
  end_date: string
  tutor: ChatUser
  student: ChatUser
  last_message: ChatMessage | null
  created_at: string
  updated_at: string
}

export type ChatConversationsResponse = {
  data: ChatConversation[]
  current_page: number
  total_page: number
  total_items: number
}

export type ChatMessagesResponse = {
  data: ChatMessage[]
  current_page: number
  total_page: number
  total_items: number
}

type PaginationParams = {
  page?: number
  perPage?: number
}

function getToken() {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }

  return session.token
}

export async function getConversations(
  params: PaginationParams = {}
): Promise<ChatConversationsResponse> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))

  const path = searchParams.toString()
    ? `chat?${searchParams.toString()}`
    : 'chat'

  return apiClient<ChatConversationsResponse>(path, {
    method: 'GET',
    token: getToken(),
  })
}

export async function getConversationMessages(
  conversationId: number,
  params: PaginationParams = {}
): Promise<ChatMessagesResponse> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))

  const path = searchParams.toString()
    ? `chat/${conversationId}/messages?${searchParams.toString()}`
    : `chat/${conversationId}/messages`

  return apiClient<ChatMessagesResponse>(path, {
    method: 'GET',
    token: getToken(),
  })
}

export async function sendConversationMessage(
  conversationId: number,
  content: string
): Promise<ChatMessage> {
  return apiClient<ChatMessage>(`chat/${conversationId}/messages`, {
    method: 'POST',
    token: getToken(),
    body: { content },
  })
}
