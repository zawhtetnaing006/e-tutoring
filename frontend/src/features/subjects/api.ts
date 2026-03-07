import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type Subject = {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

export type SubjectsResponse = {
  data: Subject[]
  current_page: number
  total_page: number
  total_items: number
}

type GetSubjectsParams = {
  page?: number
  perPage?: number
}

export async function getSubjects(
  params: GetSubjectsParams = {}
): Promise<SubjectsResponse> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }

  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.perPage != null)
    searchParams.set('per_page', String(params.perPage))

  const path = searchParams.toString()
    ? `subjects?${searchParams.toString()}`
    : 'subjects'

  return apiClient<SubjectsResponse>(path, {
    method: 'GET',
    token: session.token,
  })
}
