import type { AuthRole, User, UserRole } from './types'

function normalizeRoleCode(code: string | undefined): string {
  return (code ?? '').trim().toUpperCase()
}

export function getAuthRoleFromRoles(roles: UserRole[] | undefined): AuthRole {
  const codes = (roles ?? []).map(role => normalizeRoleCode(role.code))

  if (codes.includes('ADMIN') || codes.includes('STAFF')) return 'staff'
  if (codes.includes('TUTOR')) return 'tutor'
  if (codes.includes('STUDENT')) return 'student'

  return 'student'
}

export function getUserRole(user: Pick<User, 'roles'> | null | undefined): AuthRole {
  return getAuthRoleFromRoles(user?.roles)
}

export function getUserRoleLabel(
  user: Pick<User, 'roles'> | null | undefined
): string {
  switch (getUserRole(user)) {
    case 'staff':
      return 'Staff'
    case 'tutor':
      return 'Tutor'
    case 'student':
      return 'Student'
    default:
      return 'User'
  }
}
