import { Outlet } from 'react-router-dom'
import { AppCopyright } from '@/components/layout/AppCopyright'

/**
 * Minimal layout for public pages: landing, login, signup, etc.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Outlet />
      </main>
      <AppCopyright />
    </div>
  )
}
