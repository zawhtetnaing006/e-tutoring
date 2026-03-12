import type { KeyboardEvent, RefObject } from 'react'
import { LoaderCircle, MessageSquarePlus, Search } from 'lucide-react'
import type { ChatConversation, ChatUser } from '@/features/chat/api'
import {
  formatRelative,
  getChatUserRoleLabel,
  getConversationPeer,
  getConversationPreview,
} from './chat-utils'

type ConversationListSidebarProps = {
  currentUserId: number | undefined
  conversations: ChatConversation[]
  activeConversationId: number | null
  isLoading: boolean
  isFetchingNextPage: boolean
  searchResults: ChatUser[]
  isSearchingUsers: boolean
  isStartingConversation: boolean
  search: string
  onSearchChange: (value: string) => void
  onSearchSubmit: () => void
  onSelectConversation: (conversationId: number) => void
  onStartConversation: (targetUserId: number) => void
  onScroll: () => void
  listRef: RefObject<HTMLDivElement | null>
}

export function ConversationListSidebar({
  currentUserId,
  conversations,
  activeConversationId,
  isLoading,
  isFetchingNextPage,
  searchResults,
  isSearchingUsers,
  isStartingConversation,
  search,
  onSearchChange,
  onSearchSubmit,
  onSelectConversation,
  onStartConversation,
  onScroll,
  listRef,
}: ConversationListSidebarProps) {
  const showSearchResults = search.trim().length > 0
  const hasConversationResults = conversations.length > 0
  const hasUserResults = searchResults.length > 0

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return

    event.preventDefault()
    onSearchSubmit()
  }

  return (
    <aside className="flex min-h-0 flex-col border-r border-border">
      <div className="border-b border-border p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search person name or email..."
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
          {showSearchResults ? (
            <>
              <SearchSectionLabel label="Conversations" />

              {isLoading ? (
                <StatusRow label="Loading conversations..." />
              ) : hasConversationResults ? (
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
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                        {(peer.name.charAt(0) || '?').toUpperCase()}
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
                <EmptyRow label="No matching conversations." />
              )}

              <SearchSectionLabel label="People" />

              {isSearchingUsers ? (
                <StatusRow label="Searching users..." />
              ) : hasUserResults ? (
                searchResults.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onStartConversation(user.id)}
                    disabled={isStartingConversation}
                    className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-muted/30 disabled:opacity-60"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {(user.name.charAt(0) || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                          {getChatUserRoleLabel(user)}
                        </span>
                      </div>
                    </div>
                    <MessageSquarePlus className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <EmptyRow label="No eligible users found." />
              )}
            </>
          ) : isLoading ? (
            <StatusRow label="Loading conversations..." />
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
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                    {(peer.name.charAt(0) || '?').toUpperCase()}
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
              Search for a person to start your first conversation.
            </div>
          )}

          {!showSearchResults && isFetchingNextPage ? (
            <StatusRow label="Loading more..." />
          ) : null}
        </div>
      </div>
    </aside>
  )
}

function SearchSectionLabel({ label }: { label: string }) {
  return (
    <div className="bg-muted/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {label}
    </div>
  )
}

function StatusRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </div>
  )
}

function EmptyRow({ label }: { label: string }) {
  return <div className="px-4 py-6 text-sm text-muted-foreground">{label}</div>
}
