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
import { useDebouncedValue, useMediaQuery } from '@/hooks'
import { parsePositiveIntParam } from '@/utils/string'
import { getConversationPeer } from './components/chat-utils'
import {
  addMessageToCache,
  removeMessageFromCache,
  replaceMessageInCache,
  updateConversationSeenState,
} from './chatQueryCache'
import type { ChatWorkspaceTab } from './components/ChatThread'

export function useCommunicationHub() {
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()
  const isLg = useMediaQuery('(min-width: 1024px)')
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
  const requestedConversationId = parsePositiveIntParam(
    searchParams.get('conversation')
  )

  const conversationListRef = useRef<HTMLDivElement | null>(null)
  const messagesListRef = useRef<HTMLDivElement | null>(null)
  /** When set, the next URL→selection sync microtask is skipped (see handleBackToConversationList). */
  const suppressConversationUrlSyncRef = useRef(false)
  const prevRequestedConversationFromUrlRef = useRef<number | null>(null)
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
    if (
      requestedConversationId != null &&
      requestedConversationId !== prevRequestedConversationFromUrlRef.current
    ) {
      suppressConversationUrlSyncRef.current = false
    }
    prevRequestedConversationFromUrlRef.current = requestedConversationId
  }, [requestedConversationId])

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
      if (suppressConversationUrlSyncRef.current) {
        suppressConversationUrlSyncRef.current = false
        return
      }

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
    optimisticConversationId ??
    (isLg ? conversations[0]?.id : null) ??
    null

  const activeConversation =
    conversations.find(
      conversation => conversation.id === resolvedConversationId
    ) ??
    (optimisticConversation?.id === resolvedConversationId
      ? optimisticConversation
      : null) ??
    (isLg ? conversations[0] : null) ??
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
    suppressConversationUrlSyncRef.current = false
    setSelectedConversationId(conversationId)
    setSearchParams({ conversation: String(conversationId) }, { replace: true })
    setSearch('')
    setSelectedDocumentId(null)
    setCommentDraft('')
    setActiveTab('chat')
  }

  const handleBackToConversationList = () => {
    suppressConversationUrlSyncRef.current = true
    setSelectedConversationId(null)
    setOptimisticConversation(null)
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete('conversation')
        return next
      },
      { replace: true }
    )
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

  const handleSelectDocument = (documentId: number | null) => {
    setSelectedDocumentId(documentId)
    setCommentDraft('')
  }

  return {
    currentUser,
    conversationListRef,
    messagesListRef,
    filteredConversations,
    activeConversation,
    activeConversationId,
    activeDocumentId,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    draft,
    setDraft,
    commentDraft,
    setCommentDraft,
    isLoadingConversations,
    isFetchingNextConversationPage,
    hasNextConversationPage,
    searchResults,
    searchUsersQuery,
    startConversationMutation,
    orderedMessages,
    messagesQuery,
    documents,
    documentsQuery,
    documentComments,
    commentsQuery,
    sendMessageMutation,
    addCommentMutation,
    uploadDocumentMutation,
    handleConversationScroll,
    handleMessagesScroll,
    handleSend,
    handleDraftKeyDown,
    handleCommentKeyDown,
    handleSelectConversation,
    handleBackToConversationList,
    handleStartConversation,
    handleSearchSubmit,
    handleUploadDocument,
    handleSubmitComment,
    handleSelectDocument,
    isLg,
  }
}

export type CommunicationHubState = ReturnType<typeof useCommunicationHub>
