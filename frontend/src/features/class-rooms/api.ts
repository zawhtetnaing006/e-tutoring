import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type ClassRoom = {
  id: number
  tutor_user_id: number
  student_user_id: number
  from_date: string
  to_date: string
  created_at: string
  updated_at: string
}

export type ClassRoomsListResponse = {
  data: ClassRoom[]
  current_page: number
  total_page: number
  total_items: number
}

export type GetClassRoomsParams = {
  page?: number
  per_page?: number
  only_mine?: boolean
  student_user_id?: number
}

export async function getClassRooms(
  params: GetClassRoomsParams = {}
): Promise<ClassRoomsListResponse> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }

  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.per_page != null)
    searchParams.set('per_page', String(params.per_page))
  if (params.only_mine != null)
    searchParams.set('only_mine', params.only_mine ? '1' : '0')

  const path =
    searchParams.toString() !== ''
      ? `class-rooms?${searchParams.toString()}`
      : 'class-rooms'

  return apiClient<ClassRoomsListResponse>(path, {
    method: 'GET',
    token: session.token,
  })
}

export type CreateClassRoomPayload = {
  tutor_user_id: number
  student_user_ids: number[]
  from_date: string
  to_date: string
}

export async function createClassRooms(
  payload: CreateClassRoomPayload
): Promise<ClassRoom[]> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }
  const response = await apiClient<ClassRoom[] | { data: ClassRoom[] }>(
    'class-rooms',
    {
      method: 'POST',
      token: session.token,
      body: payload as Record<string, unknown>,
    }
  )
  return Array.isArray(response) ? response : response.data
}
