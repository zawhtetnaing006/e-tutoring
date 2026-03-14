import type { AuthRole, User, UserRoleCode } from './types'

function normalizeRoleCode(code: string | undefined): string {
  return (code ?? '').trim().toUpperCase()
}

export function getAuthRoleFromRoleCode(
  roleCode: UserRoleCode | null | undefined
): AuthRole {
  const normalizedRoleCode = normalizeRoleCode(roleCode)

  if (normalizedRoleCode === 'ADMIN' || normalizedRoleCode === 'STAFF') {
    return 'staff'
  }

  if (normalizedRoleCode === 'TUTOR') return 'tutor'
  if (normalizedRoleCode === 'STUDENT') return 'student'

  return 'student'
}

export function getUserRole(
  user: Pick<User, 'role_code'> | null | undefined
): AuthRole {
  return getAuthRoleFromRoleCode(user?.role_code)
}

export function getUserRoleLabel(
  user: Pick<User, 'role_code' | 'role_name'> | null | undefined
): string {
  if (user?.role_name) {
    return user.role_name
  }

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
