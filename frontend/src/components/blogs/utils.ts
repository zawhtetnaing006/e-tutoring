import type { Blog } from '@/features/blogs/api'

export function canManageBlog(
  blog: Blog,
  currentUserId: number | undefined,
  currentUserRole: 'staff' | 'tutor' | 'student'
): boolean {
  if (!currentUserId) return false
  if (currentUserRole === 'staff') return true
  return currentUserId === blog.author_user_id
}
