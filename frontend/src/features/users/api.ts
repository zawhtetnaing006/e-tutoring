import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'
import type { User } from '@/features/auth'

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
  password?: string
  password_confirmation?: string
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
): Promise<User> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }

  return apiClient<User>(`users/${userIdentifier}`, {
    method: 'PUT',
    token: session.token,
    body: payload,
  })
}
