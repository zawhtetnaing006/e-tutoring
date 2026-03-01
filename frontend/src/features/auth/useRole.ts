import type { AuthRole } from './types'
import { getAuthSession } from './storage'

function userTypeToRole(userType: string | undefined): AuthRole {
  if (!userType) return 'student'
  const lower = userType.toLowerCase()
  if (lower === 'staff' || lower === 'tutor' || lower === 'student')
    return lower as AuthRole
  return 'student'
}

/**
 * Returns current user role from session for role-based UI.
 */
export function useRole(): AuthRole {
  const session = getAuthSession()
  return userTypeToRole(session?.user?.user_type)
}
