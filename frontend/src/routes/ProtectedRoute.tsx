import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { paths } from '@/routes/index'
import { useIsAuthenticated } from '@/features/auth'

/**
 * Renders children (dashboard layout) only when authenticated; otherwise redirects to login.
 */
export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate to={paths.public.login} state={{ from: location }} replace />
    )
  }

  return <Outlet />
}
