import { useInfiniteQuery } from '@tanstack/react-query'
import {
  getConversationMessages,
  getConversations,
  type ChatConversationsResponse,
  type ChatMessagesResponse,
} from './api'

export function useConversations() {
  return useInfiniteQuery<ChatConversationsResponse>({
    queryKey: ['chat', 'conversations'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getConversations({ page: pageParam, perPage: 10 }),
    getNextPageParam: lastPage =>
      lastPage.current_page < lastPage.total_page
        ? lastPage.current_page + 1
        : undefined,
  })
}

export function useConversationMessages(conversationId: number | null) {
  return useInfiniteQuery<ChatMessagesResponse>({
    queryKey: ['chat', 'messages', conversationId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getConversationMessages(conversationId as number, {
        page: pageParam,
        perPage: 20,
      }),
    enabled: conversationId != null,
    getNextPageParam: lastPage =>
      lastPage.current_page < lastPage.total_page
        ? lastPage.current_page + 1
        : undefined,
  })
}
