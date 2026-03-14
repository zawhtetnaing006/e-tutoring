import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type SubjectRef = {
  id: number
  name: string
  description: string
}

/** Single user as returned by GET /users/{id} and POST/PUT responses */
export type UserResource = {
  id?: number
  uuid: string
  name: string
  email: string
  phone: string | null
  address: string | null
  country: string | null
  city: string | null
  township: string | null
  is_active: boolean
  user_type: string
  subjects?: SubjectRef[]
  created_at: string
  updated_at: string
}

export type ListUser = UserResource

export type UsersListResponse = {
  data: ListUser[]
  current_page: number
  total_page: number
  total_items: number
}

export type GetUsersParams = {
  page?: number
  per_page?: number
  user_type?: 'STAFF' | 'STUDENT' | 'TUTOR'
}

export async function getUsers(
  params: GetUsersParams = {}
): Promise<UsersListResponse> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }

  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.per_page != null)
    searchParams.set('per_page', String(params.per_page))
  if (params.user_type) searchParams.set('user_type', params.user_type)

  const path =
    searchParams.toString() !== ''
      ? `users?${searchParams.toString()}`
      : 'users'

  return apiClient<UsersListResponse>(path, {
    method: 'GET',
    token: session.token,
  })
}

/** Get a single user by id or uuid */
export async function getUser(
  userIdentifier: string | number
): Promise<UserResource> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }
  return apiClient<UserResource>(`users/${userIdentifier}`, {
    method: 'GET',
    token: session.token,
  })
}

export type CreateUserPayload = {
  name: string
  email: string
  user_type: 'STAFF' | 'STUDENT' | 'TUTOR'
  auto_generate_password?: boolean
  password?: string | null
  phone?: string | null
  address?: string | null
  country?: string | null
  city?: string | null
  township?: string | null
  is_active?: boolean
  subject_ids?: number[]
}

export async function createUser(
  payload: CreateUserPayload
): Promise<UserResource> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }
  return apiClient<UserResource>('users', {
    method: 'POST',
    token: session.token,
    body: payload as Record<string, unknown>,
  })
}

export type UsersResponse = {
  data: User[]
  current_page: number
  total_page: number
  total_items: number
}

export type GetUsersParams = {
  page?: number
  perPage?: number
  name?: string
  roleCode?: string
}

export type UpdateUserPayload = {
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
  phone?: string | null
  address?: string | null
  country?: string | null
  city?: string | null
  township?: string | null
  is_active?: boolean
  subject_ids?: number[]
}

export async function getUsers(
  params: GetUsersParams = {}
): Promise<UsersResponse> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }

  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))
  if (params.name) searchParams.set('name', params.name)
  if (params.roleCode) searchParams.set('role_code', params.roleCode)

  const path = searchParams.toString()
    ? `users?${searchParams.toString()}`
    : 'users'

  return apiClient<UsersResponse>(path, {
    method: 'GET',
    token: session.token,
  })
}

export async function updateUser(
  userIdentifier: string | number,
  payload: UpdateUserPayload
): Promise<UserResource> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }
  return apiClient<UserResource>(`users/${userIdentifier}`, {
    method: 'PUT',
    token: session.token,
    body: payload as Record<string, unknown>,
  })
}

export async function deleteUser(
  userIdentifier: string | number
): Promise<void> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }
  await apiClient<null>(`users/${userIdentifier}`, {
    method: 'DELETE',
    token: session.token,
  })
}
