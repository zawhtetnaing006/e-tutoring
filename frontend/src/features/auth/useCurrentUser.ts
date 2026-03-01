import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from './api'
import { useIsAuthenticated } from './useIsAuthenticated'

const CURRENT_USER_QUERY_KEY = ['auth', 'me'] as const

/**
 * Fetches the current user from /api/auth/me.
 * Only runs when authenticated. Returns undefined while loading or when unauthenticated.
 */
export function useCurrentUser() {
  const isAuthenticated = useIsAuthenticated()

  const query = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUser,
    enabled: isAuthenticated,
  })

  return query
}
