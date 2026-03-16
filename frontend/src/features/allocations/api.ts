import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type Allocation = {
  id: number
  tutor_user_id: number
  student_user_id: number
  from_date: string
  to_date: string
  status: 'ACTIVE' | 'INACTIVE' | null
  created_at: string
  updated_at: string
}

export type AllocationsResponse = {
  data: Allocation[]
  current_page: number
  total_page: number
  total_items: number
}

export type GetAllocationsParams = {
  page?: number
  perPage?: number
  search?: string
}

export type CreateAllocationPayload = {
  tutor_user_id: number
  student_user_ids: number[]
  from_date: string
  to_date: string
  status?: 'ACTIVE' | 'INACTIVE' | null
}

export type UpdateAllocationPayload = {
  tutor_user_id: number
  student_user_id: number
  from_date: string
  to_date: string
  status?: 'ACTIVE' | 'INACTIVE' | null
}

function getToken() {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }

  return session.token
}

export async function getAllocations(
  params: GetAllocationsParams = {}
): Promise<AllocationsResponse> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))
  if (params.search) searchParams.set('search', params.search)

  const path = searchParams.toString()
    ? `tutor-assignments?${searchParams.toString()}`
    : 'tutor-assignments'

  return apiClient<AllocationsResponse>(path, {
    method: 'GET',
    token: getToken(),
  })
}

export async function getAllocation(id: number): Promise<Allocation> {
  return apiClient<Allocation>(`tutor-assignments/${id}`, {
    method: 'GET',
    token: getToken(),
  })
}

export async function createAllocation(
  payload: CreateAllocationPayload
): Promise<Allocation[]> {
  return apiClient<Allocation[]>('tutor-assignments', {
    method: 'POST',
    token: getToken(),
    body: payload,
  })
}

export async function updateAllocation(
  id: number,
  payload: UpdateAllocationPayload
): Promise<Allocation> {
  return apiClient<Allocation>(`tutor-assignments/${id}`, {
    method: 'PUT',
    token: getToken(),
    body: payload,
  })
}

export async function deleteAllocation(id: number): Promise<void> {
  await apiClient<null>(`tutor-assignments/${id}`, {
    method: 'DELETE',
    token: getToken(),
  })
}

export async function deleteAllocations(ids: number[]): Promise<void> {
  await apiClient<null>('tutor-assignments', {
    method: 'DELETE',
    token: getToken(),
    body: {
      tutor_assignment_ids: ids,
    },
  })
}
