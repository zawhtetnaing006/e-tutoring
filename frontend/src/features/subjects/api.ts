import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type Subject = {
  id: number
  name: string
  description: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type SubjectsResponse = {
  data: Subject[]
  current_page: number
  total_page: number
  total_items: number
}

export type GetSubjectsParams = {
  page?: number
  per_page?: number
  /** @deprecated Use per_page */
  perPage?: number
  name?: string
  is_active?: boolean
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
  const perPage = params.per_page ?? params.perPage
  if (perPage != null) searchParams.set('per_page', String(perPage))
  if (params.name != null && params.name.trim() !== '') {
    searchParams.set('name', params.name.trim())
  }
  if (params.is_active != null) {
    searchParams.set('is_active', params.is_active ? '1' : '0')
  }

  const path = searchParams.toString()
    ? `subjects?${searchParams.toString()}`
    : 'subjects'

  return apiClient<SubjectsResponse>(path, {
    method: 'GET',
    token: session.token,
  })
}

export async function getSubject(subjectId: number): Promise<Subject> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }
  return apiClient<Subject>(`subjects/${subjectId}`, {
    method: 'GET',
    token: session.token,
  })
}

export type CreateSubjectPayload = {
  name: string
  description?: string | null
}

export async function createSubject(
  payload: CreateSubjectPayload
): Promise<Subject> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }
  return apiClient<Subject>('subjects', {
    method: 'POST',
    token: session.token,
    body: payload as Record<string, unknown>,
  })
}

export type UpdateSubjectPayload = {
  name: string
  description?: string | null
}

export async function updateSubject(
  subjectId: number,
  payload: UpdateSubjectPayload
): Promise<Subject> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }
  return apiClient<Subject>(`subjects/${subjectId}`, {
    method: 'PUT',
    token: session.token,
    body: payload as Record<string, unknown>,
  })
}

export async function toggleSubjectStatus(
  subjectId: number,
  isActive: boolean
): Promise<Subject> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }
  return apiClient<Subject>(`subjects/${subjectId}/toggle-status`, {
    method: 'POST',
    token: session.token,
    body: { is_active: isActive } as Record<string, unknown>,
  })
}

export async function deleteSubject(subjectId: number): Promise<void> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }
  await apiClient<null>(`subjects/${subjectId}`, {
    method: 'DELETE',
    token: session.token,
  })
}
