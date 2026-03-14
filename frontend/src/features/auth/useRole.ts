import { getAuthSession } from './storage'
import { getUserRole } from './role-utils'

/**
 * Returns current user role from session for role-based UI.
 */
export function useRole() {
  const session = getAuthSession()
  return getUserRole(session?.user)
}
