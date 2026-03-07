import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'
import type { User } from '@/features/auth'

export type UpdateUserPayload = {
  password?: string
  password_confirmation?: string
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
