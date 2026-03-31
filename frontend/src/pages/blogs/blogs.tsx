import {
  BlogDetailModal,
  BlogEditorModal,
  BlogFilters,
  BlogGrid,
  BlogListPagination,
} from '@/components/blogs'
import { BLOGS_PAGE_SIZE, useBlogsPage } from './useBlogsPage'

export function BlogsPage() {
  const {
    currentUser,
    currentUserRole,
    page,
    setPage,
    search,
    setSearch,
    statusFilter,
    selectedIds,
    menuOpenBlogId,
    setMenuOpenBlogId,
    isEditorModalOpen,
    editingBlog,
    formTitle,
    setFormTitle,
    formHashtags,
    setFormHashtags,
    formCoverPreview,
    editorRef,
    detailBlogId,
    setDetailBlogId,
    closeDetailModal,
    commentDraft,
    setCommentDraft,
    commentPage,
    setCommentPage,
    blogsQuery,
    blogs,
    detailQuery,
    detailBlog,
    commentsQuery,
    comments,
    commentsTotalPages,
    totalPages,
    totalItems,
    createMutation,
    updateMutation,
    createCommentMutation,
    closeEditorModal,
    openNewModal,
    openEditModal,
    handleFileChange,
    applyEditorCommand,
    handleSaveBlog,
    handleDeleteBlog,
    handleDeleteSelected,
    handleToggleStatus,
    handleToggleSelect,
    toggleFilter,
    handleExportCsv,
    handlePostComment,
    handleRemoveCover,
    setFormContent,
  } = useBlogsPage()

  return (
    <div className="flex h-full max-h-screen w-full flex-col overflow-hidden bg-background">
      <div className="flex h-full flex-col overflow-hidden p-4 sm:p-6">
        <BlogFilters
          search={search}
          onSearchChange={value => {
            setSearch(value)
            setPage(1)
          }}
          statusFilter={statusFilter}
          onExportCsv={handleExportCsv}
          onToggleStatusFilter={toggleFilter}
          onDeleteSelected={handleDeleteSelected}
          onNewBlog={openNewModal}
        />

        <div className="mt-8 min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <BlogGrid
              blogs={blogs}
              isLoading={blogsQuery.isLoading}
              menuOpenBlogId={menuOpenBlogId}
              currentUserId={currentUser?.id}
              currentUserRole={currentUserRole}
              selectedIds={selectedIds}
              onOpenDetail={blogId => {
                setDetailBlogId(blogId)
                setMenuOpenBlogId(null)
              }}
              onToggleSelect={(blogId, event) => {
                event.stopPropagation()
                handleToggleSelect(blogId)
              }}
              onToggleMenu={(blogId, event) => {
                event.stopPropagation()
                setMenuOpenBlogId(current =>
                  current === blogId ? null : blogId
                )
              }}
              onViewDetails={blogId => {
                setDetailBlogId(blogId)
                setMenuOpenBlogId(null)
              }}
              onEdit={blog => {
                openEditModal(blog)
                setMenuOpenBlogId(null)
              }}
              onToggleStatus={blogId => {
                handleToggleStatus(blogId)
                setMenuOpenBlogId(null)
              }}
              onDelete={blogId => {
                handleDeleteBlog(blogId)
                setMenuOpenBlogId(null)
              }}
              onMenuEscape={() => setMenuOpenBlogId(null)}
            />
          </div>
        </div>

        <BlogListPagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={BLOGS_PAGE_SIZE}
          selectedCount={selectedIds.length}
          visibleCount={blogs.length}
          onPageChange={setPage}
        />
      </div>

      <BlogEditorModal
        isOpen={isEditorModalOpen}
        onClose={closeEditorModal}
        editingBlog={editingBlog}
        formTitle={formTitle}
        onTitleChange={setFormTitle}
        formHashtags={formHashtags}
        onHashtagsChange={setFormHashtags}
        formCoverPreview={formCoverPreview}
        onCoverFileChange={handleFileChange}
        onRemoveCover={handleRemoveCover}
        editorRef={editorRef}
        onEditorInput={setFormContent}
        applyEditorCommand={applyEditorCommand}
        onSave={handleSaveBlog}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      <BlogDetailModal
        isOpen={detailBlogId != null}
        onClose={closeDetailModal}
        isLoading={detailBlogId != null && detailQuery.isLoading}
        blog={detailBlog ?? null}
        comments={comments}
        commentsLoading={commentsQuery.isLoading}
        commentsTotalPages={commentsTotalPages}
        commentPage={commentPage}
        onCommentPagePrev={() =>
          setCommentPage(current => Math.max(1, current - 1))
        }
        onCommentPageNext={() =>
          setCommentPage(current => Math.min(commentsTotalPages, current + 1))
        }
        commentDraft={commentDraft}
        onCommentDraftChange={setCommentDraft}
        onPostComment={handlePostComment}
        isPostingComment={createCommentMutation.isPending}
      />
    </div>
  )
}
