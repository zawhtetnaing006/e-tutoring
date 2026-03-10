import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type BlogAuthor = {
  id: number
  uuid: string
  name: string
  user_type: string
}

export type BlogComment = {
  id: number
  blog_id: number
  comment_text: string
  commenter_user_id: number | null
  commenter: BlogAuthor | null
  created_at: string
  updated_at: string
}

export type Blog = {
  id: number
  title: string
  content: string
  author_user_id: number | null
  author: BlogAuthor | null
  comment_count?: number
  comments?: BlogComment[]
  created_at: string
  updated_at: string
}

export type PaginatedResponse<T> = {
  data: T[]
  current_page: number
  total_page: number
  total_items: number
}

export type GetBlogsParams = {
  page?: number
  perPage?: number
  search?: string
}

export type GetBlogCommentsParams = {
  page?: number
  perPage?: number
}

export type CreateBlogPayload = {
  title: string
  content: string
}

export type CreateBlogCommentPayload = {
  comment_text: string
}

function getToken(required: boolean): string | undefined {
  const session = getAuthSession()
  const token = session?.token

  if (required && !token) {
    throw new ApiError(401, 'Not authenticated')
  }

  return token ?? undefined
}

export async function getBlogs(
  params: GetBlogsParams = {}
): Promise<PaginatedResponse<Blog>> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))
  if (params.search) searchParams.set('search', params.search)

  const path = searchParams.toString()
    ? `blogs?${searchParams.toString()}`
    : 'blogs'

  return apiClient<PaginatedResponse<Blog>>(path, {
    method: 'GET',
    token: getToken(false),
  })
}

export async function getBlog(blogId: number): Promise<Blog> {
  return apiClient<Blog>(`blogs/${blogId}`, {
    method: 'GET',
    token: getToken(false),
  })
}

export async function getBlogComments(
  blogId: number,
  params: GetBlogCommentsParams = {}
): Promise<PaginatedResponse<BlogComment>> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))

  const path = searchParams.toString()
    ? `blogs/${blogId}/comments?${searchParams.toString()}`
    : `blogs/${blogId}/comments`

  return apiClient<PaginatedResponse<BlogComment>>(path, {
    method: 'GET',
    token: getToken(false),
  })
}

export async function createBlog(payload: CreateBlogPayload): Promise<Blog> {
  return apiClient<Blog>('blogs', {
    method: 'POST',
    token: getToken(true),
    body: payload,
  })
}

export async function createBlogComment(
  blogId: number,
  payload: CreateBlogCommentPayload
): Promise<BlogComment> {
  return apiClient<BlogComment>(`blogs/${blogId}/comments`, {
    method: 'POST',
    token: getToken(true),
    body: payload,
  })
}
