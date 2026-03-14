import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type BlogAuthor = {
  id: number
  uuid: string
  name: string
  role_code: string | null
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
  hashtags: string[]
  is_active: boolean
  view_count: number
  cover_image_url: string | null
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
  isActive?: boolean
}

export type GetBlogCommentsParams = {
  page?: number
  perPage?: number
}

export type CreateBlogPayload = {
  title: string
  content: string
  hashtags?: string
  coverImageFile?: File | null
}

export type UpdateBlogPayload = {
  title?: string
  content?: string
  hashtags?: string
  coverImageFile?: File | null
  removeCoverImage?: boolean
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

function toBlogFormData(payload: CreateBlogPayload | UpdateBlogPayload): FormData {
  const formData = new FormData()

  if (payload.title != null) formData.append('title', payload.title)
  if (payload.content != null) formData.append('content', payload.content)
  if (payload.hashtags != null) formData.append('hashtags', payload.hashtags)

  if (payload.coverImageFile) {
    formData.append('cover_image', payload.coverImageFile)
  }

  if ('removeCoverImage' in payload && payload.removeCoverImage) {
    formData.append('remove_cover_image', '1')
  }

  return formData
}

export async function getBlogs(
  params: GetBlogsParams = {}
): Promise<PaginatedResponse<Blog>> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))
  if (params.search) searchParams.set('search', params.search)
  if (params.isActive != null) {
    searchParams.set('is_active', params.isActive ? '1' : '0')
  }

  const path = searchParams.toString()
    ? `blogs?${searchParams.toString()}`
    : 'blogs'

  return apiClient<PaginatedResponse<Blog>>(path, {
    method: 'GET',
    token: getToken(true),
  })
}

export async function getBlog(blogId: number): Promise<Blog> {
  return apiClient<Blog>(`blogs/${blogId}`, {
    method: 'GET',
    token: getToken(true),
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
    token: getToken(true),
  })
}

export async function createBlog(payload: CreateBlogPayload): Promise<Blog> {
  return apiClient<Blog>('blogs', {
    method: 'POST',
    token: getToken(true),
    body: toBlogFormData(payload),
  })
}

export async function updateBlog(
  blogId: number,
  payload: UpdateBlogPayload
): Promise<Blog> {
  return apiClient<Blog>(`blogs/${blogId}`, {
    method: 'POST',
    token: getToken(true),
    body: (() => {
      const formData = toBlogFormData(payload)
      formData.append('_method', 'PUT')
      return formData
    })(),
  })
}

export async function toggleBlogStatus(blogId: number): Promise<Blog> {
  return apiClient<Blog>(`blogs/${blogId}/toggle-status`, {
    method: 'POST',
    token: getToken(true),
  })
}

export async function deleteBlog(blogId: number): Promise<void> {
  await apiClient<null>(`blogs/${blogId}`, {
    method: 'DELETE',
    token: getToken(true),
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
