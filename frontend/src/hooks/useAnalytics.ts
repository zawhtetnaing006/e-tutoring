import { useEffect, useState } from 'react'
import { getAnalytics, type AnalyticsResponse } from '@/api'
import { ApiError } from '@/lib/api-client'

type UseAnalyticsResult = {
  data: AnalyticsResponse | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch analytics data from the backend
 */
export function useAnalytics(): UseAnalyticsResult {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getAnalytics()
      setData(result)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err)
      } else if (err instanceof Error) {
        setError(err)
      } else {
        setError(new Error('Failed to fetch analytics'))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  }
}
