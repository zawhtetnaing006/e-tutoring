import type { AuthRole } from './types'

/**
 * Placeholder: returns current user role for role-based UI.
 * Wire to auth context / session when auth is implemented.
 */
export function useRole(): AuthRole {
  // TODO: read from AuthContext / session (e.g. useAuth().user.role)
  return 'staff'
}
