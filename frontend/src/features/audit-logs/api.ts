import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type AuditLogItem = {
  id: number
  date_time: string | null
  actor: string
  action: string
  target: string
  description: string
}

export type AuditLogsResponse = {
  data: AuditLogItem[]
  current_page: number
  total_page: number
  total_items: number
}

/** UI role filter slugs (matched client-side against `actor` text from the API). */
export type AuditLogRoleSlug = 'admin' | 'staff' | 'student' | 'tutor'

export type GetAuditLogsParams = {
  page?: number
  per_page?: number
  search?: string
}

export async function getAuditLogs(
  params: GetAuditLogsParams = {}
): Promise<AuditLogsResponse> {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }

  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.per_page != null)
    searchParams.set('per_page', String(params.per_page))
  if (params.search?.trim()) searchParams.set('search', params.search.trim())

  const path =
    searchParams.toString() !== ''
      ? `audit-logs?${searchParams.toString()}`
      : 'audit-logs'

  return apiClient<AuditLogsResponse>(path, {
    method: 'GET',
    token: session.token,
  })
}
