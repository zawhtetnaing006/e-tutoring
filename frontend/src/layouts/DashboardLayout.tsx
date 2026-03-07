import { Link, Outlet } from 'react-router-dom'
import { paths } from '@/routes/index'
import { getSidebarNavigation } from '@/static_data/navigation'
import { useRole } from '@/features/auth/useRole'
import { PanelRightOpen } from 'lucide-react'
import { SidebarUserSection } from '@/components/dashboard/SidebarUserSection'

/**
 * Single dashboard layout with role-based sidebar navigation.
 */
export function DashboardLayout() {
  const role = useRole()
  const sections = getSidebarNavigation(role)

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <aside className="flex min-h-screen w-sidebar flex-col border-r border-border bg-muted/30 p-4">
        <nav className="flex min-h-0 flex-1 flex-col space-y-1 text-subtext">
          <Link
            to={paths.dashboard}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-body font-medium text-foreground hover:bg-muted"
          >
            <PanelRightOpen className="size-5 shrink-0" />
            eTutor System
          </Link>
          <section className="flex flex-1 flex-col gap-6 pt-6">
            {sections.map(section => (
              <div key={section.title} className="space-y-1">
                <h2 className="mb-2 text-subtext font-semibold uppercase tracking-wide text-text-disabled">
                  {section.title}
                </h2>
                <ul className="space-y-1">
                  {section.items.map(item => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className="flex items-center gap-2 rounded-md px-3 py-2 text-body font-medium text-foreground hover:bg-muted"
                      >
                        {item.icon && <item.icon className="size-5 shrink-0" />}
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </nav>
        <SidebarUserSection />
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
