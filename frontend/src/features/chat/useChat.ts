import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  addDocumentComment,
  getConversationDocuments,
  getConversationMessages,
  getConversations,
  getDocumentComments,
  markConversationSeen,
  sendConversationMessage,
  searchChatUsers,
  startConversation,
  type ChatConversation,
  type ChatDocument,
  type ChatDocumentComment,
  type ChatMessage,
  type ChatUser,
  type PaginatedResponse,
  uploadConversationDocument,
} from './api'

export function useConversations() {
  return useInfiniteQuery<PaginatedResponse<ChatConversation>>({
    queryKey: ['chat', 'conversations'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getConversations({ page: pageParam as number, perPage: 10 }),
    getNextPageParam: lastPage =>
      lastPage.current_page < lastPage.total_page
        ? lastPage.current_page + 1
        : undefined,
  })
}

export function useConversationMessages(conversationId: number | null) {
  return useInfiniteQuery<PaginatedResponse<ChatMessage>>({
    queryKey: ['chat', 'messages', conversationId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getConversationMessages(conversationId as number, {
        page: pageParam as number,
        perPage: 20,
      }),
    enabled: conversationId != null,
    getNextPageParam: lastPage =>
      lastPage.current_page < lastPage.total_page
        ? lastPage.current_page + 1
        : undefined,
  })
}

export function useChatUserSearch(search: string, enabled = true) {
  return useQuery<PaginatedResponse<ChatUser>>({
    queryKey: ['chat', 'search', search],
    queryFn: () => searchChatUsers({ search, perPage: 20 }),
    enabled: enabled && search.trim().length > 0,
  })
}

export function useConversationDocuments(conversationId: number | null) {
  return useInfiniteQuery<PaginatedResponse<ChatDocument>>({
    queryKey: ['chat', 'documents', conversationId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getConversationDocuments(conversationId as number, {
        page: pageParam as number,
        perPage: 20,
      }),
    enabled: conversationId != null,
    getNextPageParam: lastPage =>
      lastPage.current_page < lastPage.total_page
        ? lastPage.current_page + 1
        : undefined,
  })
}

export function useDocumentComments(documentId: number | null) {
  return useInfiniteQuery<PaginatedResponse<ChatDocumentComment>>({
    queryKey: ['chat', 'document-comments', documentId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getDocumentComments(documentId as number, {
        page: pageParam as number,
        perPage: 20,
      }),
    enabled: documentId != null,
    getNextPageParam: lastPage =>
      lastPage.current_page < lastPage.total_page
        ? lastPage.current_page + 1
        : undefined,
  })
}

export {
  addDocumentComment,
  markConversationSeen,
  sendConversationMessage,
  startConversation,
  uploadConversationDocument,
}
