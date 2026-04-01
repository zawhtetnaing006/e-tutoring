import type { KeyboardEvent, ReactNode, RefObject } from 'react'
import {
  ChevronLeft,
  LoaderCircle,
  MessageSquareText,
  SendHorizontal,
} from 'lucide-react'
import type { ChatConversation, ChatMessage } from '@/features/chat/api'
import { formatMessageTime, getConversationPeer } from './chat-utils'

export type ChatWorkspaceTab = 'chat' | 'shared'

function MessageBubble({
  message,
  isOwnMessage,
  statusLabel,
}: {
  message: ChatMessage
  isOwnMessage: boolean
  statusLabel?: string | null
}) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'border border-border bg-background text-foreground'
          }`}
        >
          {message.content}
        </div>
        <p
          className={`mt-1 text-xs text-muted-foreground ${
            isOwnMessage ? 'text-right' : 'text-left'
          }`}
        >
          {message.is_sending
            ? 'Sending...'
            : formatMessageTime(message.created_at)}
          {!message.is_sending && statusLabel ? ` · ${statusLabel}` : ''}
        </p>
      </div>
    </div>
  )
}

type ChatThreadProps = {
  activeConversation: ChatConversation | null
  currentUserId: number | undefined
  /** When set (e.g. mobile), shows a back control to return to the conversation list. */
  onBack?: () => void
  activeTab: ChatWorkspaceTab
  onTabChange: (tab: ChatWorkspaceTab) => void
  messages: ChatMessage[]
  isLoadingMessages: boolean
  isFetchingMoreMessages: boolean
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  onDraftKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onMessagesScroll: () => void
  messagesRef: RefObject<HTMLDivElement | null>
  sharedContent: ReactNode
}

export function ChatThread({
  activeConversation,
  currentUserId,
  onBack,
  activeTab,
  onTabChange,
  messages,
  isLoadingMessages,
  isFetchingMoreMessages,
  draft,
  onDraftChange,
  onSend,
  onDraftKeyDown,
  onMessagesScroll,
  messagesRef,
  sharedContent,
}: ChatThreadProps) {
  if (!activeConversation) {
    return (
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-muted-foreground">
          <div>
            <MessageSquareText className="mx-auto mb-3 size-10" />
            <p className="text-sm font-medium text-foreground">
              No conversation selected
            </p>
            <p className="mt-1 text-sm">
              <span className="hidden lg:inline">
                Search for a person on the left to start chatting or open an
                existing conversation.
              </span>
              <span className="lg:hidden">
                Search for a person or choose a conversation from the list.
              </span>
            </p>
          </div>
        </div>
      </section>
    )
  }

  const peer = getConversationPeer(activeConversation, currentUserId)
  const latestOwnMessageId =
    [...messages]
      .reverse()
      .find(
        message =>
          message.sender_id === currentUserId &&
          !message.is_sending &&
          message.id > 0
      )?.id ?? null
  const otherUserLastSeenMessageId =
    activeConversation.other_user_last_seen_message_id

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-border px-3 py-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="-ml-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-muted"
              aria-label="Back to conversations"
            >
              <ChevronLeft className="size-5" />
            </button>
          ) : null}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
            {(peer.name.charAt(0) || '?').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {peer.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {peer.email}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-border px-3 py-2.5 text-sm text-muted-foreground sm:gap-5 sm:px-5 sm:py-3">
        <button
          type="button"
          onClick={() => onTabChange('chat')}
          className={`border-b-2 pb-1 font-medium ${
            activeTab === 'chat'
              ? 'border-blue-500 text-foreground'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => onTabChange('shared')}
          className={`border-b-2 pb-1 font-medium ${
            activeTab === 'shared'
              ? 'border-blue-500 text-foreground'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          Shared
        </button>
      </div>

      {activeTab === 'chat' ? (
        <>
          <div
            ref={messagesRef}
            onScroll={onMessagesScroll}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5 sm:py-6"
          >
            {isFetchingMoreMessages ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Loading older messages...
              </div>
            ) : null}

            {isLoadingMessages ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Loading messages...
              </div>
            ) : messages.length > 0 ? (
              messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender_id === currentUserId}
                  statusLabel={
                    message.sender_id === currentUserId &&
                    message.id === latestOwnMessageId &&
                    !message.is_sending
                      ? otherUserLastSeenMessageId != null &&
                        otherUserLastSeenMessageId >= message.id
                        ? 'Seen'
                        : 'Sent'
                      : null
                  }
                />
              ))
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <MessageSquareText className="mb-3 size-10" />
                <p className="text-sm font-medium text-foreground">
                  No messages yet
                </p>
                <p className="mt-1 text-sm">
                  Start the conversation with {peer.name}.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 sm:p-4">
            <div className="flex items-end gap-2 sm:gap-3">
              <textarea
                value={draft}
                onChange={event => onDraftChange(event.target.value)}
                onKeyDown={onDraftKeyDown}
                placeholder="Write a message..."
                rows={1}
                className="min-h-12 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <button
                type="button"
                onClick={onSend}
                disabled={!draft.trim()}
                className="inline-flex size-12 items-center justify-center rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <SendHorizontal className="size-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        sharedContent
      )}
    </section>
  )
}
