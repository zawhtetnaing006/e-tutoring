import { ConversationListSidebar } from './components/ConversationListSidebar'
import { ChatThread } from './components/ChatThread'
import { SharedDocumentsPanel } from './components/SharedDocumentsPanel'
import type { CommunicationHubState } from './useCommunicationHub'

type CommunicationHubWorkspaceProps = {
  hub: CommunicationHubState
}

export function CommunicationHubWorkspace({
  hub,
}: CommunicationHubWorkspaceProps) {
  const {
    currentUser,
    conversationListRef,
    messagesListRef,
    filteredConversations,
    activeConversation,
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
    searchResults,
    searchUsersQuery,
    startConversationMutation,
    orderedMessages,
    messagesQuery,
    documents,
    documentsQuery,
    documentComments,
    commentsQuery,
    addCommentMutation,
    uploadDocumentMutation,
    handleConversationScroll,
    handleMessagesScroll,
    handleSend,
    handleDraftKeyDown,
    handleCommentKeyDown,
    handleSelectConversation,
    handleStartConversation,
    handleSearchSubmit,
    handleUploadDocument,
    handleSubmitComment,
    handleSelectDocument,
  } = hub

  return (
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
            onSelectDocument={handleSelectDocument}
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
  )
}
