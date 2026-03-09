import type { RefObject } from 'react'
import { LoaderCircle, Search } from 'lucide-react'
import type { ChatConversation } from '@/features/chat/api'
import {
  formatRelative,
  getConversationPeer,
  getConversationPreview,
} from './chat-utils'

type ConversationListSidebarProps = {
  currentUserId: number | undefined
  conversations: ChatConversation[]
  activeConversationId: number | null
  isLoading: boolean
  isFetchingNextPage: boolean
  search: string
  onSearchChange: (value: string) => void
  onSelectConversation: (conversationId: number) => void
  onScroll: () => void
  listRef: RefObject<HTMLDivElement | null>
}

export function ConversationListSidebar({
  currentUserId,
  conversations,
  activeConversationId,
  isLoading,
  isFetchingNextPage,
  search,
  onSearchChange,
  onSelectConversation,
  onScroll,
  listRef,
}: ConversationListSidebarProps) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-border">
      <div className="border-b border-border p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            placeholder="Search person name..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading conversations...
            </div>
          ) : conversations.length > 0 ? (
            conversations.map(conversation => {
              const peer = getConversationPeer(conversation, currentUserId)
              const isActive = activeConversationId === conversation.id

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-muted/30 ${
                    isActive ? 'bg-muted/40' : ''
                  }`}
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                    {peer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm font-medium text-foreground">
                        {peer.name}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {conversation.last_message
                          ? formatRelative(conversation.last_message.created_at)
                          : ''}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {getConversationPreview(conversation)}
                    </p>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              No conversations found.
            </div>
          )}

          {isFetchingNextPage ? (
            <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading more...
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
