import { useQuery } from '@tanstack/react-query'
import {
  getBlog,
  getBlogComments,
  getBlogs,
  type Blog,
  type BlogComment,
  type PaginatedResponse,
} from './api'

type UseBlogsOptions = {
  page?: number
  perPage?: number
  search?: string
}

export function useBlogs(options: UseBlogsOptions = {}) {
  const { page = 1, perPage = 10, search = '' } = options

  return useQuery<PaginatedResponse<Blog>>({
    queryKey: ['blogs', page, perPage, search],
    queryFn: () =>
      getBlogs({
        page,
        perPage,
        search,
      }),
  })
}

export function useBlog(blogId: number | null) {
  return useQuery<Blog>({
    queryKey: ['blogs', 'detail', blogId],
    queryFn: () => getBlog(blogId as number),
    enabled: blogId != null,
  })
}

type UseBlogCommentsOptions = {
  page?: number
  perPage?: number
  enabled?: boolean
}

export function useBlogComments(
  blogId: number | null,
  options: UseBlogCommentsOptions = {}
) {
  const { page = 1, perPage = 20, enabled = true } = options

  return useQuery<PaginatedResponse<BlogComment>>({
    queryKey: ['blogs', 'comments', blogId, page, perPage],
    queryFn: () => getBlogComments(blogId as number, { page, perPage }),
    enabled: enabled && blogId != null,
  })
}
