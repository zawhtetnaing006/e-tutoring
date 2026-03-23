import { useQuery } from '@tanstack/react-query'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { getUnreadCount } from './api'
import type { UnreadCountResponse } from './types'

export function useUnreadCount() {
  const { data: user } = useCurrentUser()
  const userId = user?.id

  return useQuery<UnreadCountResponse>({
    queryKey: ['notifications', 'unread-count', userId],
    queryFn: getUnreadCount,
    enabled: userId != null,
    refetchInterval: 30000,
  })
}
