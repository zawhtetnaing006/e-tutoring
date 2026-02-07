import { Link, Outlet } from 'react-router-dom'
import { paths } from '@/routes/index'

/**
 * Layout for admin dashboard: sidebar + main content.
 * Add admin nav, sidebar, and wrap <Outlet /> here.
 */
export function AdminDashboardLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-border bg-muted/30 p-4">
        <nav className="space-y-1 text-sm">
          <Link
            to={paths.admin.dashboard}
            className="block rounded-md px-3 py-2 font-medium text-foreground hover:bg-muted"
          >
            Dashboard
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
