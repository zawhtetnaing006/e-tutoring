import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getAnalytics, type AnalyticsResponse } from '@/api'
import { ApiError } from '@/lib/api-client'

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
 * Hook to fetch analytics data from the backend
 */
export function useAnalytics(): UseAnalyticsResult {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)

  const fetchAnalytics = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }
      setError(null)
      const result = await getAnalytics({ cacheBust: !isInitial })
      setData(result)
      setFetchedAt(new Date())
    } catch (err) {
      if (isInitial) {
        if (err instanceof ApiError) {
          setError(err)
        } else if (err instanceof Error) {
          setError(err)
        } else {
          setError(new Error('Failed to fetch analytics'))
        }
      } else {
        toast.error(
          err instanceof Error ? err.message : 'Could not refresh analytics'
        )
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void fetchAnalytics(true)
  }, [fetchAnalytics])

  return {
    data,
    loading,
    refreshing,
    error,
    fetchedAt,
    refetch: () => fetchAnalytics(false),
  }
}
