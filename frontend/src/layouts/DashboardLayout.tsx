import { useState, useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { paths } from '@/routes/index'
import { getSidebarNavigation } from '@/static_data/navigation'
import { useRole } from '@/features/auth/useRole'
import {
  useNotificationsRealtime,
  useUnreadCount,
} from '@/features/notifications'
import { PanelLeftOpen, PanelRightOpen, Menu, X } from 'lucide-react'
import { SidebarUserSection } from '@/components/dashboard/SidebarUserSection'
import { AppCopyright } from '@/components/layout/AppCopyright'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'

/**
 * Single dashboard layout with role-based sidebar navigation.
 */
export function DashboardLayout() {
  const role = useRole()
  const sections = getSidebarNavigation(role)
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const prevPathnameRef = useRef(location.pathname)

  useNotificationsRealtime()
  const { data: unreadCountData } = useUnreadCount()
  const unreadCount = unreadCountData?.count ?? 0

  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleMobileMenu = () => {
    setIsCollapsed(false)
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return (
      location.pathname === href || location.pathname.startsWith(href + '/')
    )
  }

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={toggleMobileMenu}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'flex min-h-screen flex-col border-r border-border bg-background',
          'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto',
          'transition-all duration-300 ease-in-out',
          isCollapsed && 'lg:w-16 lg:overflow-visible lg:px-2 lg:py-4',
          !isCollapsed && 'lg:w-sidebar lg:p-4',
          isMobileMenuOpen
            ? 'w-64 translate-x-0 p-4'
            : '-translate-x-full lg:translate-x-0'
        )}
      >
        <nav
          className={cn(
            'flex min-h-0 flex-1 flex-col space-y-1 text-subtext',
            isCollapsed ? 'lg:overflow-visible' : 'overflow-hidden'
          )}
        >
          <div
            className={cn(
              'flex min-h-[44px] shrink-0 items-center rounded-md py-2',
              isCollapsed ? 'lg:justify-center lg:px-2' : 'gap-2'
            )}
          >
            <button
              onClick={toggleMobileMenu}
              className="flex items-center justify-center rounded-md p-1 text-foreground transition-all duration-200 hover:bg-muted lg:hidden"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
            <button
              onClick={toggleSidebar}
              className="hidden shrink-0 items-center justify-center rounded-md p-1 text-foreground transition-all duration-200 hover:bg-muted lg:flex"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="size-5" />
              ) : (
                <PanelRightOpen className="size-5" />
              )}
            </button>
            <Link
              to={paths.dashboard}
              className={cn(
                'flex items-center gap-2 overflow-hidden',
                'text-body font-medium text-foreground hover:underline',
                'transition-all duration-300 ease-in-out',
                isCollapsed
                  ? 'lg:invisible lg:w-0 lg:opacity-0'
                  : 'lg:visible lg:w-auto lg:opacity-100'
              )}
            >
              <img
                src="/assets/logo.png"
                alt="E-Tutor System"
                className="size-6 shrink-0"
              />
              <span className="whitespace-nowrap">E-Tutor System</span>
            </Link>
          </div>
          <section
            className={cn(
              'flex flex-1 flex-col gap-6 pt-6',
              isCollapsed
                ? 'lg:overflow-visible'
                : 'overflow-y-auto overflow-x-hidden'
            )}
          >
            {sections.map(section => (
              <div key={section.title} className="space-y-1">
                {!isCollapsed && (
                  <h2 className="mb-2 px-3 text-subtext font-semibold uppercase tracking-wide text-text-disabled">
                    {section.title}
                  </h2>
                )}
                <ul className="space-y-1">
                  {section.items.map(item => {
                    const isActive = isActiveLink(item.href)
                    const isNotifications = item.href === '/notifications'
                    const showBadge = isNotifications && unreadCount > 0
                    return (
                      <li key={item.name}>
                        <Tooltip content={item.name} disabled={!isCollapsed}>
                          <Link
                            to={item.href}
                            className={cn(
                              'flex items-center rounded-md py-2 text-body font-medium transition-all duration-200',
                              isCollapsed
                                ? 'justify-center px-1'
                                : 'gap-2 px-3',
                              isActive
                                ? 'bg-muted text-foreground'
                                : 'text-foreground hover:bg-muted'
                            )}
                          >
                            <div className="relative flex items-center">
                              {item.icon && (
                                <item.icon className="size-5 shrink-0" />
                              )}
                            </div>
                            {!isCollapsed && (
                              <span className="flex flex-1 items-center justify-between whitespace-nowrap">
                                {item.name}
                                {showBadge && (
                                  <span className="ml-2 flex size-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-500">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                  </span>
                                )}
                              </span>
                            )}
                          </Link>
                        </Tooltip>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </section>
        </nav>
        <SidebarUserSection isCollapsed={isCollapsed} />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col xl:max-h-screen">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background px-4 py-3 lg:hidden">
          <button
            onClick={toggleMobileMenu}
            className="flex items-center justify-center rounded-md p-2 text-foreground transition-all duration-200 hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <Link to={paths.dashboard} className="flex items-center gap-2">
            <img
              src="/assets/logo.png"
              alt="E-Tutor System"
              className="size-6"
            />
            <span className="text-body font-medium text-foreground">
              E-Tutor System
            </span>
          </Link>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
        <AppCopyright />
      </div>
    </div>
  )
}
