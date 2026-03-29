import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { getAnalytics, type AnalyticsResponse } from '@/api'

const ANALYTICS_QUERY_KEY = ['analytics'] as const

type UseAnalyticsResult = {
  data: AnalyticsResponse | null
  loading: boolean
  /** True while re-fetching after the first load (keeps existing data on screen). */
  refreshing: boolean
  error: Error | null
  fetchedAt: Date | null
  refetch: () => Promise<void>
}

/**
 * Dashboard analytics from `GET /api/analytics`.
 * Uses React Query so the request is deduplicated (e.g. React Strict Mode dev double-mount).
 */
export function useAnalytics(): UseAnalyticsResult {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ANALYTICS_QUERY_KEY,
    queryFn: () => getAnalytics(),
    staleTime: 1000 * 60 * 5,
  })

  const refetch = useCallback(async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: ANALYTICS_QUERY_KEY,
        queryFn: () => getAnalytics({ cacheBust: true }),
      })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not refresh analytics'
      )
    }
  }, [queryClient])

  const error =
    query.error instanceof Error
      ? query.error
      : query.error
        ? new Error(String(query.error))
        : null

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    error,
    fetchedAt: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    refetch,
  }
}
