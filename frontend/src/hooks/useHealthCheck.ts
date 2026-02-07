import { useQuery } from '@tanstack/react-query'
import { getHealth } from '@/api/health'

const healthQueryKey = ['health'] as const

export function useHealthCheck() {
  return useQuery({
    queryKey: healthQueryKey,
    queryFn: getHealth,
    staleTime: 1000 * 60 * 3, // 3 minutes cache
  })
}
