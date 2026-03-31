import type { Blog } from '@/features/blogs/api'

export function canManageBlog(
  _blog: Blog,
  currentUserId: number | undefined,
  currentUserRole: 'staff' | 'tutor' | 'student'
): boolean {
  if (!currentUserId) return false
  return currentUserRole === 'staff'
}
