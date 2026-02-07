import { Link, Outlet } from 'react-router-dom'
import { paths } from '@/routes/index'

/**
 * Layout for personal tutor dashboard
 */
export function TutorDashboardLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-border bg-muted/30 p-4">
        <nav className="space-y-1 text-sm">
          <Link
            to={paths.tutor.dashboard}
            className="block rounded-md px-3 py-2 font-medium text-foreground hover:bg-muted"
          >
            My tutees
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
