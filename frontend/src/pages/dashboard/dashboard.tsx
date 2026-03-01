import { useRole } from '@/features/auth/useRole'

/**
 * Single dashboard page. Content can be tailored by role when auth is wired.
 */
export function DashboardPage() {
  const role = useRole()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="max-w-2xl text-body text-muted-foreground">
        {role === 'staff' &&
          'Tutor allocation, staff dashboards, and student dashboards.'}
        {role === 'student' &&
          'Summary of your activity with your personal tutor.'}
        {role === 'tutor' &&
          'Your personal tutees. Sort and filter to find students. Click through to messaging, meetings, documents, blog.'}
      </p>
    </div>
  )
}
