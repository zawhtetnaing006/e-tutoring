import { useQuery } from '@tanstack/react-query'
import { useIsAuthenticated } from '@/features/auth/useIsAuthenticated'
import { getAuditLogs, type AuditLogsResponse } from './api'

type UseAuditLogsOptions = {
  page?: number
  perPage?: number
  search?: string
  enabled?: boolean
}

export function useAuditLogs(
  options: UseAuditLogsOptions = {}
): ReturnType<typeof useQuery<AuditLogsResponse>> {
  const { page = 1, perPage = 10, search = '', enabled = true } = options
  const isAuthenticated = useIsAuthenticated()

  return useQuery<AuditLogsResponse>({
    queryKey: ['audit-logs', 'list', page, perPage, search],
    queryFn: () =>
      getAuditLogs({
        page,
        per_page: perPage,
        search: search || undefined,
      }),
    enabled: enabled && isAuthenticated,
    /** Paginated lists: avoid long-lived cache mixing pages/filters (global staleTime is 5m). */
    staleTime: 0,
    gcTime: 1000 * 60 * 2,
  })
}
