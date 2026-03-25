import { apiClient, ApiError, getBaseUrl } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'
import type { UserRoleCode } from '@/features/auth/types'

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
  role_code: UserRoleCode | null
  role_name: string | null
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
  perPage?: number
  name?: string
  role_code?: 'ADMIN' | 'STAFF' | 'STUDENT' | 'TUTOR'
}

export type ExportUsersPayload = {
  user_ids: number[]
  role_code: 'ADMIN' | 'STAFF' | 'STUDENT' | 'TUTOR'
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
  const perPage = params.per_page ?? params.perPage
  if (perPage != null) searchParams.set('per_page', String(perPage))
  if (params.name) searchParams.set('name', params.name)
  if (params.role_code) searchParams.set('role_code', params.role_code)

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
  role_code: 'ADMIN' | 'STAFF' | 'STUDENT' | 'TUTOR'
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
  role_code?: 'ADMIN' | 'STAFF' | 'STUDENT' | 'TUTOR'
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

export async function exportUsersExcel(
  payload: ExportUsersPayload
): Promise<Blob> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }

  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Add it to .env or .env.local'
    )
  }

  const response = await fetch(`${baseUrl}/users/export`, {
    method: 'POST',
    headers: {
      Accept:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : response.statusText || 'Failed to export users'

    throw new ApiError(response.status, message, data)
  }

  return response.blob()
}
