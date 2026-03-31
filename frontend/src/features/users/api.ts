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
  profile_image_url: string | null
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
  profileImageFile?: File | null
  removeProfileImage?: boolean
  is_active?: boolean
  subject_ids?: number[]
  role_code?: 'ADMIN' | 'STAFF' | 'STUDENT' | 'TUTOR'
}

function toUserFormData(payload: UpdateUserPayload): FormData {
  const formData = new FormData()

  if (payload.name != null) formData.append('name', payload.name)
  if (payload.email != null) formData.append('email', payload.email)
  if (payload.password != null) formData.append('password', payload.password)
  if (payload.password_confirmation != null) {
    formData.append('password_confirmation', payload.password_confirmation)
  }
  if (payload.phone !== undefined) formData.append('phone', payload.phone ?? '')
  if (payload.address !== undefined) {
    formData.append('address', payload.address ?? '')
  }
  if (payload.country !== undefined) {
    formData.append('country', payload.country ?? '')
  }
  if (payload.city !== undefined) formData.append('city', payload.city ?? '')
  if (payload.township !== undefined) {
    formData.append('township', payload.township ?? '')
  }
  if (payload.is_active != null) {
    formData.append('is_active', payload.is_active ? '1' : '0')
  }
  if (payload.role_code != null) formData.append('role_code', payload.role_code)
  if (payload.subject_ids != null) {
    payload.subject_ids.forEach(subjectId => {
      formData.append('subject_ids[]', String(subjectId))
    })
  }
  if (payload.profileImageFile) {
    formData.append('profile_image', payload.profileImageFile)
  }
  if (payload.removeProfileImage) {
    formData.append('remove_profile_image', '1')
  }

  formData.append('_method', 'PUT')

  return formData
}

export async function updateUser(
  userIdentifier: string | number,
  payload: UpdateUserPayload
): Promise<UserResource> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }

  const requiresMultipart =
    payload.profileImageFile != null || payload.removeProfileImage === true

  return apiClient<UserResource>(`users/${userIdentifier}`, {
    method: requiresMultipart ? 'POST' : 'PUT',
    token: session.token,
    body: requiresMultipart
      ? toUserFormData(payload)
      : (payload as Record<string, unknown>),
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
