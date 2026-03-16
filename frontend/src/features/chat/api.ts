import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type ChatUser = {
  id: number
  name: string
  email: string
  role_code: string | null
}

export type ChatMessage = {
  id: number
  conversation_id: number
  sender_id: number | null
  sender_name: string
  content: string
  created_at: string
  updated_at: string
  is_sending?: boolean
}

export type ChatConversation = {
  id: number
  members: ChatUser[]
  last_message: ChatMessage | null
  current_user_last_seen_message_id: number | null
  other_user_last_seen_message_id: number | null
  other_user_seen_at: string | null
  created_at: string
  updated_at: string
}

export type ChatSeenReceipt = {
  conversation_id: number
  user_id: number
  last_seen_message_id: number | null
  seen_at: string | null
}

export type ChatDocument = {
  id: number
  conversation_id: number
  uploaded_by_user_id: number | null
  uploader_name: string
  file_name: string
  file_path: string
  file_url: string | null
  file_size_bytes: number
  mime_type: string
  comments_count?: number
  created_at: string
  updated_at: string
}

export type ChatDocumentComment = {
  id: number
  document_id: number
  conversation_id?: number
  commenter_user_id: number | null
  commenter_name: string
  comment: string
  created_at: string
  updated_at: string
}

export type PaginatedResponse<T> = {
  data: T[]
  current_page: number
  total_page: number
  total_items: number
}

type PaginationParams = {
  page?: number
  perPage?: number
}

type SearchChatUsersParams = PaginationParams & {
  search: string
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
): Promise<PaginatedResponse<ChatConversation>> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))

  const path = searchParams.toString()
    ? `chat?${searchParams.toString()}`
    : 'chat'

  return apiClient<PaginatedResponse<ChatConversation>>(path, {
    method: 'GET',
    token: getToken(),
  })
}

export async function searchChatUsers(
  params: SearchChatUsersParams
): Promise<PaginatedResponse<ChatUser>> {
  const searchParams = new URLSearchParams()
  searchParams.set('search', params.search)
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))

  return apiClient<PaginatedResponse<ChatUser>>(
    `chat/search?${searchParams.toString()}`,
    {
      method: 'GET',
      token: getToken(),
    }
  )
}

export async function startConversation(
  targetUserId: number
): Promise<ChatConversation> {
  return apiClient<ChatConversation>('chat/conversations', {
    method: 'POST',
    token: getToken(),
    body: { target_user_id: targetUserId },
  })
}

export async function getConversationMessages(
  conversationId: number,
  params: PaginationParams = {}
): Promise<PaginatedResponse<ChatMessage>> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))

  const path = searchParams.toString()
    ? `chat/${conversationId}/messages?${searchParams.toString()}`
    : `chat/${conversationId}/messages`

  return apiClient<PaginatedResponse<ChatMessage>>(path, {
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

export async function markConversationSeen(
  conversationId: number
): Promise<ChatSeenReceipt> {
  return apiClient<ChatSeenReceipt>(`chat/${conversationId}/seen`, {
    method: 'POST',
    token: getToken(),
  })
}

export async function getConversationDocuments(
  conversationId: number,
  params: PaginationParams = {}
): Promise<PaginatedResponse<ChatDocument>> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))

  const path = searchParams.toString()
    ? `chat/${conversationId}/documents?${searchParams.toString()}`
    : `chat/${conversationId}/documents`

  return apiClient<PaginatedResponse<ChatDocument>>(path, {
    method: 'GET',
    token: getToken(),
  })
}

export async function uploadConversationDocument(
  conversationId: number,
  file: File
): Promise<ChatDocument> {
  const formData = new FormData()
  formData.append('file', file)

  return apiClient<ChatDocument>(`chat/${conversationId}/documents`, {
    method: 'POST',
    token: getToken(),
    body: formData,
  })
}

export async function getDocumentComments(
  documentId: number,
  params: PaginationParams = {}
): Promise<PaginatedResponse<ChatDocumentComment>> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))

  const path = searchParams.toString()
    ? `chat/documents/${documentId}/comments?${searchParams.toString()}`
    : `chat/documents/${documentId}/comments`

  return apiClient<PaginatedResponse<ChatDocumentComment>>(path, {
    method: 'GET',
    token: getToken(),
  })
}

export async function addDocumentComment(
  documentId: number,
  comment: string
): Promise<ChatDocumentComment> {
  return apiClient<ChatDocumentComment>(`chat/documents/${documentId}/comments`, {
    method: 'POST',
    token: getToken(),
    body: { comment },
  })
}
