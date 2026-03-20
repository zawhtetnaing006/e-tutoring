import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import type {
  ChatConversation,
  ChatMessage,
  PaginatedResponse,
} from '@/features/chat/api'
import { useChatRealtime } from '@/features/chat/useChatRealtime'
import {
  addDocumentComment,
  markConversationSeen,
  startConversation,
  uploadConversationDocument,
  useChatUserSearch,
  useConversationDocuments,
  useConversationMessages,
  useConversations,
  useDocumentComments,
  sendConversationMessage,
} from '@/features/chat/useChat'
import { useDebouncedValue } from '@/hooks'
import { getConversationPeer } from './components/chat-utils'
import { ConversationListSidebar } from './components/ConversationListSidebar'
import { ChatThread, type ChatWorkspaceTab } from './components/ChatThread'
import { SharedDocumentsPanel } from './components/SharedDocumentsPanel'

function createOptimisticMessagesState(
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

function addMessageToCache(
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

function replaceMessageInCache(
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

function removeMessageFromCache(
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

function updateConversationSeenState(
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

function parseConversationParam(value: string | null): number | null {
  if (value == null) {
    return null
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export function CommunicationHubPage() {
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [activeTab, setActiveTab] = useState<ChatWorkspaceTab>('chat')
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    null
  )
  const [optimisticConversation, setOptimisticConversation] =
    useState<ChatConversation | null>(null)
  const debouncedSearch = useDebouncedValue(search.trim(), 350)
  const requestedConversationId = parseConversationParam(
    searchParams.get('conversation')
  )

  const conversationListRef = useRef<HTMLDivElement | null>(null)
  const messagesListRef = useRef<HTMLDivElement | null>(null)
  const prevConversationIdRef = useRef<number | null>(null)
  const shouldStickToBottomRef = useRef(true)
  const seenAttemptRef = useRef<Record<number, number>>({})

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
  const searchUsersQuery = useChatUserSearch(
    debouncedSearch,
    debouncedSearch.length > 0
  )
  const searchResults = searchUsersQuery.data?.data ?? []

  const filteredConversations = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return conversations

    return conversations.filter(conversation =>
      (() => {
        const peer = getConversationPeer(conversation, currentUser?.id)
        return (
          peer.name.toLowerCase().includes(term) ||
          peer.email.toLowerCase().includes(term)
        )
      })()
    )
  }, [conversations, currentUser?.id, search])

  useEffect(() => {
    if (requestedConversationId == null) {
      return
    }

    const hasRequestedConversation =
      conversations.some(
        conversation => conversation.id === requestedConversationId
      ) || optimisticConversation?.id === requestedConversationId

    if (!hasRequestedConversation) {
      if (hasNextConversationPage && !isFetchingNextConversationPage) {
        void fetchNextConversationsPage()
      }

      return
    }

    if (selectedConversationId === requestedConversationId) {
      return
    }

    queueMicrotask(() => {
      setSelectedConversationId(requestedConversationId)
      setSearch('')
      setSelectedDocumentId(null)
      setCommentDraft('')
      setActiveTab('chat')
    })
  }, [
    conversations,
    fetchNextConversationsPage,
    hasNextConversationPage,
    isFetchingNextConversationPage,
    optimisticConversation?.id,
    requestedConversationId,
    selectedConversationId,
  ])

  const optimisticConversationId =
    optimisticConversation &&
    conversations.every(({ id }) => id !== optimisticConversation.id)
      ? optimisticConversation.id
      : null

  const resolvedConversationId =
    selectedConversationId ??
    conversations[0]?.id ??
    optimisticConversationId ??
    null

  const activeConversation =
    conversations.find(
      conversation => conversation.id === resolvedConversationId
    ) ??
    (optimisticConversation?.id === resolvedConversationId
      ? optimisticConversation
      : null) ??
    conversations[0] ??
    (optimisticConversationId != null ? optimisticConversation : null) ??
    null

  const activeConversationId = activeConversation?.id ?? null
  const messagesQuery = useConversationMessages(activeConversationId)
  const documentsQuery = useConversationDocuments(activeConversationId)
  const documents = useMemo(
    () => (documentsQuery.data?.pages ?? []).flatMap(page => page.data),
    [documentsQuery.data?.pages]
  )
  const activeDocumentId =
    selectedDocumentId != null &&
    documents.some(document => document.id === selectedDocumentId)
      ? selectedDocumentId
      : null
  const commentsQuery = useDocumentComments(activeDocumentId)
  const documentComments = useMemo(
    () => (commentsQuery.data?.pages ?? []).flatMap(page => page.data),
    [commentsQuery.data?.pages]
  )
  const subscribedConversationIds = useMemo(() => {
    const conversationIds = conversations.map(conversation => conversation.id)

    if (optimisticConversation) {
      conversationIds.push(optimisticConversation.id)
    }

    return conversationIds
  }, [conversations, optimisticConversation])

  useChatRealtime({
    conversationIds: subscribedConversationIds,
    activeDocumentId,
  })

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
    onMutate: async ({ content, conversationId }) => {
      const optimisticMessageId = -Date.now()
      const optimisticMessage: ChatMessage = {
        id: optimisticMessageId,
        conversation_id: conversationId,
        sender_id: currentUser?.id ?? 0,
        sender_name: currentUser?.name ?? 'You',
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_sending: true,
      }

      shouldStickToBottomRef.current = true
      setDraft('')

      await queryClient.cancelQueries({
        queryKey: ['chat', 'messages', conversationId],
      })

      queryClient.setQueryData<InfiniteData<PaginatedResponse<ChatMessage>>>(
        ['chat', 'messages', conversationId],
        current => addMessageToCache(current, optimisticMessage)
      )

      return {
        content,
        conversationId,
        optimisticMessageId,
      }
    },
    onSuccess: (message, _, context) => {
      if (!context) {
        return
      }

      shouldStickToBottomRef.current = true

      queryClient.setQueryData<InfiniteData<PaginatedResponse<ChatMessage>>>(
        ['chat', 'messages', context.conversationId],
        current =>
          replaceMessageInCache(current, context.optimisticMessageId, message)
      )
    },
    onError: (error, _, context) => {
      if (context) {
        queryClient.setQueryData<InfiniteData<PaginatedResponse<ChatMessage>>>(
          ['chat', 'messages', context.conversationId],
          current =>
            removeMessageFromCache(current, context.optimisticMessageId)
        )

        setDraft(currentDraft =>
          currentDraft.trim().length === 0 ? context.content : currentDraft
        )
      }

      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to send message', { description })
    },
    onSettled: (_, __, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['chat', 'conversations'],
      })
      void queryClient.invalidateQueries({
        queryKey: ['chat', 'messages', variables.conversationId],
      })
    },
  })

  const markSeenMutation = useMutation({
    mutationFn: ({
      conversationId,
    }: {
      conversationId: number
      currentSeenMessageId: number
      latestIncomingMessageId: number
    }) => markConversationSeen(conversationId),
    onMutate: variables => {
      seenAttemptRef.current[variables.conversationId] =
        variables.latestIncomingMessageId

      return {
        conversationId: variables.conversationId,
        previousSeenMessageId: variables.currentSeenMessageId,
      }
    },
    onSuccess: receipt => {
      seenAttemptRef.current[receipt.conversation_id] =
        receipt.last_seen_message_id ?? 0

      queryClient.setQueryData<
        InfiniteData<PaginatedResponse<ChatConversation>>
      >(['chat', 'conversations'], current =>
        updateConversationSeenState(current, receipt, currentUser?.id)
      )
    },
    onError: (_error, variables, context) => {
      seenAttemptRef.current[variables.conversationId] =
        context?.previousSeenMessageId ?? 0
    },
  })

  useEffect(() => {
    if (
      activeTab !== 'chat' ||
      !activeConversationId ||
      !currentUser?.id ||
      orderedMessages.length === 0
    ) {
      return
    }

    const latestIncomingMessage = [...orderedMessages]
      .reverse()
      .find(
        message =>
          !message.is_sending &&
          message.id > 0 &&
          message.sender_id !== currentUser.id
      )

    if (!latestIncomingMessage) {
      return
    }

    const currentSeenMessageId =
      activeConversation?.current_user_last_seen_message_id ?? 0
    const latestIncomingMessageId = latestIncomingMessage.id

    if (latestIncomingMessageId <= currentSeenMessageId) {
      // eslint-disable-next-line security/detect-object-injection
      seenAttemptRef.current[activeConversationId] = currentSeenMessageId
      return
    }

    const attemptedSeenMessageId =
      seenAttemptRef.current[activeConversationId] ?? 0
    if (attemptedSeenMessageId >= latestIncomingMessageId) {
      return
    }

    // eslint-disable-next-line security/detect-object-injection
    seenAttemptRef.current[activeConversationId] = latestIncomingMessageId

    markSeenMutation.mutate({
      conversationId: activeConversationId,
      currentSeenMessageId,
      latestIncomingMessageId,
    })
  }, [
    activeConversation?.current_user_last_seen_message_id,
    activeConversationId,
    activeTab,
    currentUser?.id,
    markSeenMutation,
    orderedMessages,
  ])

  const startConversationMutation = useMutation({
    mutationFn: (targetUserId: number) => startConversation(targetUserId),
    onSuccess: conversation => {
      setOptimisticConversation(conversation)
      setSelectedConversationId(conversation.id)
      setSearchParams(
        { conversation: String(conversation.id) },
        { replace: true }
      )
      setSearch('')
      setSelectedDocumentId(null)
      setCommentDraft('')
      setActiveTab('chat')
      void queryClient.invalidateQueries({
        queryKey: ['chat', 'conversations'],
      })
    },
    onError: error => {
      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to start conversation', { description })
    },
  })

  const uploadDocumentMutation = useMutation({
    mutationFn: ({
      conversationId,
      file,
    }: {
      conversationId: number
      file: File
    }) => uploadConversationDocument(conversationId, file),
    onSuccess: document => {
      setActiveTab('shared')
      setSelectedDocumentId(document.id)
      void queryClient.invalidateQueries({
        queryKey: ['chat', 'documents', document.conversation_id],
      })
    },
    onError: error => {
      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to upload document', { description })
    },
  })

  const addCommentMutation = useMutation({
    mutationFn: ({
      documentId,
      comment,
    }: {
      documentId: number
      comment: string
    }) => addDocumentComment(documentId, comment),
    onSuccess: comment => {
      setCommentDraft('')
      const conversationId = comment.conversation_id ?? activeConversationId

      if (conversationId != null) {
        void queryClient.invalidateQueries({
          queryKey: ['chat', 'documents', conversationId],
        })
      }

      void queryClient.invalidateQueries({
        queryKey: ['chat', 'document-comments', comment.document_id],
      })
    },
    onError: error => {
      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to add comment', { description })
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

  const handleCommentKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) return

    event.preventDefault()
    if (!activeDocumentId) return

    const comment = commentDraft.trim()
    if (!comment) return

    addCommentMutation.mutate({
      documentId: activeDocumentId,
      comment,
    })
  }

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversationId(conversationId)
    setSearchParams({ conversation: String(conversationId) }, { replace: true })
    setSearch('')
    setSelectedDocumentId(null)
    setCommentDraft('')
    setActiveTab('chat')
  }

  const handleStartConversation = (targetUserId: number) => {
    startConversationMutation.mutate(targetUserId)
  }

  const handleSearchSubmit = () => {
    if (startConversationMutation.isPending || searchUsersQuery.isFetching) {
      return
    }

    const firstUserResult = searchResults[0]
    if (firstUserResult) {
      handleStartConversation(firstUserResult.id)
      return
    }

    const firstConversation = filteredConversations[0]
    if (firstConversation) {
      handleSelectConversation(firstConversation.id)
    }
  }

  const handleUploadDocument = (file: File) => {
    if (!activeConversationId) return

    uploadDocumentMutation.mutate({
      conversationId: activeConversationId,
      file,
    })
  }

  const handleSubmitComment = () => {
    if (!activeDocumentId) return

    const comment = commentDraft.trim()
    if (!comment) return

    addCommentMutation.mutate({
      documentId: activeDocumentId,
      comment,
    })
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-0 w-full flex-col sm:h-[calc(100vh-6rem)] lg:h-[calc(100vh-3rem)]">
      <section className="flex min-h-0 flex-1 flex-col space-y-3 sm:space-y-4 lg:space-y-5">
        <div className="px-1">
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Communication Hub
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
            Connect with students and tutors anytime
          </p>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-lg border border-border bg-background sm:rounded-xl lg:grid-cols-[320px_minmax(0,1fr)] lg:rounded-2xl">
          <ConversationListSidebar
            currentUserId={currentUser?.id}
            conversations={filteredConversations}
            activeConversationId={activeConversation?.id ?? null}
            isLoading={isLoadingConversations}
            isFetchingNextPage={isFetchingNextConversationPage}
            searchResults={searchResults}
            onSearchSubmit={handleSearchSubmit}
            isSearchingUsers={
              searchUsersQuery.isPending || searchUsersQuery.isFetching
            }
            isStartingConversation={startConversationMutation.isPending}
            search={search}
            onSearchChange={setSearch}
            onSelectConversation={handleSelectConversation}
            onStartConversation={handleStartConversation}
            onScroll={handleConversationScroll}
            listRef={conversationListRef}
          />

          <ChatThread
            activeConversation={activeConversation}
            currentUserId={currentUser?.id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            messages={orderedMessages}
            isLoadingMessages={messagesQuery.isLoading}
            isFetchingMoreMessages={messagesQuery.isFetchingNextPage}
            draft={draft}
            onDraftChange={setDraft}
            onSend={handleSend}
            onDraftKeyDown={handleDraftKeyDown}
            onMessagesScroll={handleMessagesScroll}
            messagesRef={messagesListRef}
            sharedContent={
              <SharedDocumentsPanel
                documents={documents}
                selectedDocumentId={activeDocumentId}
                onSelectDocument={documentId => {
                  setSelectedDocumentId(documentId)
                  setCommentDraft('')
                }}
                isLoadingDocuments={documentsQuery.isLoading}
                isFetchingMoreDocuments={documentsQuery.isFetchingNextPage}
                hasMoreDocuments={documentsQuery.hasNextPage ?? false}
                onLoadMoreDocuments={() => {
                  if (
                    documentsQuery.hasNextPage &&
                    !documentsQuery.isFetchingNextPage
                  ) {
                    void documentsQuery.fetchNextPage()
                  }
                }}
                onUploadDocument={handleUploadDocument}
                isUploadingDocument={uploadDocumentMutation.isPending}
                comments={documentComments}
                isLoadingComments={commentsQuery.isLoading}
                isFetchingMoreComments={commentsQuery.isFetchingNextPage}
                hasMoreComments={commentsQuery.hasNextPage ?? false}
                onLoadMoreComments={() => {
                  if (
                    commentsQuery.hasNextPage &&
                    !commentsQuery.isFetchingNextPage
                  ) {
                    void commentsQuery.fetchNextPage()
                  }
                }}
                commentDraft={commentDraft}
                onCommentDraftChange={setCommentDraft}
                onCommentDraftKeyDown={handleCommentKeyDown}
                onSubmitComment={handleSubmitComment}
                isSubmittingComment={addCommentMutation.isPending}
              />
            }
          />
        </div>
      </section>
    </div>
  )
}
