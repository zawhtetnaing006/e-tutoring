import { useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { ChatDocumentComment, ChatMessage } from './api'
import { getChatEcho } from './realtime'

type DocumentSharedEvent = {
  conversation_id: number
}

type UseChatRealtimeOptions = {
  conversationIds: number[]
  activeDocumentId: number | null
}

export function useChatRealtime({
  conversationIds,
  activeDocumentId,
}: UseChatRealtimeOptions) {
  const queryClient = useQueryClient()
  const activeDocumentIdRef = useRef<number | null>(activeDocumentId)

  useEffect(() => {
    activeDocumentIdRef.current = activeDocumentId
  }, [activeDocumentId])

  const stableConversationIds = useMemo(() => {
    return Array.from(new Set(conversationIds)).sort((left, right) => left - right)
  }, [conversationIds])

  useEffect(() => {
    const echo = getChatEcho()
    if (!echo || stableConversationIds.length === 0) {
      return
    }

    stableConversationIds.forEach(conversationId => {
      echo
        .private(`conversation.${conversationId}`)
        .listen('.message.sent', (event: ChatMessage) => {
          void queryClient.invalidateQueries({
            queryKey: ['chat', 'conversations'],
          })
          void queryClient.invalidateQueries({
            queryKey: ['chat', 'messages', event.conversation_id],
          })
        })
        .listen('.document.shared', (event: DocumentSharedEvent) => {
          void queryClient.invalidateQueries({
            queryKey: ['chat', 'documents', event.conversation_id],
          })
        })
        .listen('.document.comment.added', (event: ChatDocumentComment) => {
          void queryClient.invalidateQueries({
            queryKey: ['chat', 'documents', event.conversation_id],
          })

          if (event.document_id === activeDocumentIdRef.current) {
            void queryClient.invalidateQueries({
              queryKey: ['chat', 'document-comments', event.document_id],
            })
          }
        })
        .listen('.message.seen', () => {
          void queryClient.invalidateQueries({
            queryKey: ['chat', 'conversations'],
          })
        })
    })

    return () => {
      stableConversationIds.forEach(conversationId => {
        echo.leave(`conversation.${conversationId}`)
      })
    }
  }, [queryClient, stableConversationIds])
}
