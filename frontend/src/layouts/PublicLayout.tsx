import { Outlet } from 'react-router-dom'

/**
 * Minimal layout for public pages: landing, login, signup, etc.
 */
export function PublicLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  )
}
