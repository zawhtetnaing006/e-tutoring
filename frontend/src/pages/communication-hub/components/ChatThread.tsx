import type { KeyboardEvent, RefObject } from 'react'
import { LoaderCircle, MessageSquareText, SendHorizontal } from 'lucide-react'
import type { ChatConversation, ChatMessage } from '@/features/chat/api'
import { formatMessageTime, getConversationPeer } from './chat-utils'

function MessageBubble({
  message,
  isOwnMessage,
}: {
  message: ChatMessage
  isOwnMessage: boolean
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
          {formatMessageTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}

type ChatThreadProps = {
  activeConversation: ChatConversation | null
  currentUserId: number | undefined
  messages: ChatMessage[]
  isLoadingMessages: boolean
  isFetchingMoreMessages: boolean
  draft: string
  onDraftChange: (value: string) => void
  onSend: () => void
  onDraftKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onMessagesScroll: () => void
  messagesRef: RefObject<HTMLDivElement | null>
  isSending: boolean
}

export function ChatThread({
  activeConversation,
  currentUserId,
  messages,
  isLoadingMessages,
  isFetchingMoreMessages,
  draft,
  onDraftChange,
  onSend,
  onDraftKeyDown,
  onMessagesScroll,
  messagesRef,
  isSending,
}: ChatThreadProps) {
  if (!activeConversation) {
    return (
      <section className="flex min-h-0 flex-col">
        <div className="flex h-full items-center justify-center text-center text-muted-foreground">
          <div>
            <MessageSquareText className="mx-auto mb-3 size-10" />
            <p className="text-sm font-medium text-foreground">
              No chat rooms available
            </p>
            <p className="mt-1 text-sm">
              Chat rooms will appear here even before the first message is sent.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const peer = getConversationPeer(activeConversation, currentUserId)

  return (
    <section className="flex min-h-0 flex-col">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
            {peer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{peer.name}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 border-b border-border px-5 py-3 text-sm text-muted-foreground">
        <button
          type="button"
          className="border-b-2 border-blue-500 pb-1 font-medium text-foreground"
        >
          Chat
        </button>
        <button type="button" className="pb-1">
          Shared
        </button>
      </div>

      <div
        ref={messagesRef}
        onScroll={onMessagesScroll}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-6"
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
            />
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <MessageSquareText className="mb-3 size-10" />
            <p className="text-sm font-medium text-foreground">
              No messages yet
            </p>
            <p className="mt-1 text-sm">
              Start the conversation for this chat room.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-end gap-3">
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
            disabled={isSending || !draft.trim()}
            className="inline-flex size-12 items-center justify-center rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <SendHorizontal className="size-4" />
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
