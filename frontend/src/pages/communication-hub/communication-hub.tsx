import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { sendConversationMessage } from '@/features/chat/api'
import {
  useConversationMessages,
  useConversations,
} from '@/features/chat/useChat'
import { getConversationPeer } from './components/chat-utils'
import { ConversationListSidebar } from './components/ConversationListSidebar'
import { ChatThread } from './components/ChatThread'

export function CommunicationHubPage() {
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null)

  const conversationListRef = useRef<HTMLDivElement | null>(null)
  const messagesListRef = useRef<HTMLDivElement | null>(null)
  const prevConversationIdRef = useRef<number | null>(null)
  const shouldStickToBottomRef = useRef(true)

  const conversationsQuery = useConversations()
  const {
    fetchNextPage: fetchNextConversationsPage,
    hasNextPage: hasNextConversationPage,
    isFetchingNextPage: isFetchingNextConversationPage,
    isLoading: isLoadingConversations,
  } = conversationsQuery
  const conversations = useMemo(
    () => (conversationsQuery.data?.pages ?? []).flatMap(page => page.data),
    [conversationsQuery.data?.pages]
  )

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return conversations

    return conversations.filter(conversation =>
      getConversationPeer(conversation, currentUser?.id)
        .name.toLowerCase()
        .includes(term)
    )
  }, [conversations, currentUser?.id, search])

  const activeConversation =
    filteredConversations.find(
      conversation => conversation.id === selectedConversationId
    ) ??
    filteredConversations[0] ??
    null

  const activeConversationId = activeConversation?.id ?? null
  const messagesQuery = useConversationMessages(activeConversationId)

  const orderedMessages = useMemo(() => {
    return (messagesQuery.data?.pages ?? [])
      .flatMap(page => page.data)
      .reverse()
  }, [messagesQuery.data?.pages])

  useEffect(() => {
    const nextConversationId = activeConversation?.id ?? null
    if (prevConversationIdRef.current !== nextConversationId) {
      prevConversationIdRef.current = nextConversationId
      shouldStickToBottomRef.current = true
    }
  }, [activeConversation?.id])

  useEffect(() => {
    const container = conversationListRef.current
    if (
      !container ||
      isLoadingConversations ||
      isFetchingNextConversationPage ||
      !hasNextConversationPage
    ) {
      return
    }

    if (container.scrollHeight <= container.clientHeight) {
      void fetchNextConversationsPage()
    }
  }, [
    conversations,
    fetchNextConversationsPage,
    hasNextConversationPage,
    isFetchingNextConversationPage,
    isLoadingConversations,
  ])

  useEffect(() => {
    const container = messagesListRef.current
    if (!container) return

    if (shouldStickToBottomRef.current && orderedMessages.length > 0) {
      container.scrollTop = container.scrollHeight
    }
  }, [orderedMessages])

  const sendMessageMutation = useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: number
      content: string
    }) => sendConversationMessage(conversationId, content),
    onSuccess: (_, variables) => {
      setDraft('')
      shouldStickToBottomRef.current = true
      void queryClient.invalidateQueries({
        queryKey: ['chat', 'conversations'],
      })
      void queryClient.invalidateQueries({
        queryKey: ['chat', 'messages', variables.conversationId],
      })
    },
    onError: error => {
      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to send message', { description })
    },
  })

  const handleConversationScroll = () => {
    const container = conversationListRef.current
    if (
      !container ||
      !hasNextConversationPage ||
      isFetchingNextConversationPage
    ) {
      return
    }

    const remaining =
      container.scrollHeight - container.scrollTop - container.clientHeight

    if (remaining < 120) {
      void fetchNextConversationsPage()
    }
  }

  const handleMessagesScroll = () => {
    const container = messagesListRef.current
    if (!container) return

    const distanceToBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    shouldStickToBottomRef.current = distanceToBottom < 64

    if (
      container.scrollTop < 120 &&
      messagesQuery.hasNextPage &&
      !messagesQuery.isFetchingNextPage
    ) {
      void messagesQuery.fetchNextPage()
    }
  }

  const handleSend = () => {
    if (!activeConversationId) return

    const content = draft.trim()
    if (!content) return

    sendMessageMutation.mutate({
      conversationId: activeConversationId,
      content,
    })
  }

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return

    event.preventDefault()
    handleSend()
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-0 w-full flex-col">
      <section className="flex min-h-0 flex-1 flex-col space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Communication Hub
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect with students and tutors anytime
          </p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border border-border bg-background lg:grid-cols-[320px_minmax(0,1fr)]">
          <ConversationListSidebar
            currentUserId={currentUser?.id}
            conversations={filteredConversations}
            activeConversationId={activeConversation?.id ?? null}
            isLoading={isLoadingConversations}
            isFetchingNextPage={isFetchingNextConversationPage}
            search={search}
            onSearchChange={setSearch}
            onSelectConversation={setSelectedConversationId}
            onScroll={handleConversationScroll}
            listRef={conversationListRef}
          />

          <ChatThread
            activeConversation={activeConversation}
            currentUserId={currentUser?.id}
            messages={orderedMessages}
            isLoadingMessages={messagesQuery.isLoading}
            isFetchingMoreMessages={messagesQuery.isFetchingNextPage}
            draft={draft}
            onDraftChange={setDraft}
            onSend={handleSend}
            onDraftKeyDown={handleDraftKeyDown}
            onMessagesScroll={handleMessagesScroll}
            messagesRef={messagesListRef}
            isSending={sendMessageMutation.isPending}
          />
        </div>
      </section>
    </div>
  )
}
