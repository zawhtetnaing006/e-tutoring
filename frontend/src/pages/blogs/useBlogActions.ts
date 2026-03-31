import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createBlog,
  deleteBlog,
  toggleBlogStatus,
  updateBlog,
} from '@/features/blogs/api'
import type { BlogFormData } from '@/components/blogs'

export interface UseBlogActionsOptions {
  onCreateSuccess?: () => void
  onUpdateSuccess?: () => void
  onDeleteSuccess?: (blogId: number) => void
}

export function useBlogActions(options: UseBlogActionsOptions = {}) {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      toast.success('Blog created successfully.')
      options.onCreateSuccess?.()
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create blog'
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      blogId,
      payload,
    }: {
      blogId: number
      payload: Parameters<typeof updateBlog>[1]
    }) => updateBlog(blogId, payload),
    onSuccess: () => {
      toast.success('Blog updated successfully.')
      options.onUpdateSuccess?.()
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update blog'
      )
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: toggleBlogStatus,
    onSuccess: () => {
      toast.success('Blog status updated.')
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update status'
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBlog,
    onSuccess: (_, blogId) => {
      toast.success('Blog deleted successfully.')
      options.onDeleteSuccess?.(blogId)
      void queryClient.invalidateQueries({ queryKey: ['blogs'] })
    },
    onError: error => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete blog'
      )
    },
  })

  const handleSave = (data: BlogFormData, editingBlogId?: number) => {
    if (editingBlogId) {
      updateMutation.mutate({
        blogId: editingBlogId,
        payload: {
          title: data.title,
          content: data.content,
          hashtags: data.hashtags,
          coverImageFile: data.coverFile,
          removeCoverImage: data.removeCoverImage,
        },
      })
    } else {
      createMutation.mutate({
        title: data.title,
        content: data.content,
        hashtags: data.hashtags,
        coverImageFile: data.coverFile,
      })
    }
  }

  const handleToggleStatus = (blogId: number) => {
    toggleStatusMutation.mutate(blogId)
  }

  const handleDelete = (blogId: number) => {
    deleteMutation.mutate(blogId)
  }

  return {
    handleSave,
    handleToggleStatus,
    handleDelete,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
