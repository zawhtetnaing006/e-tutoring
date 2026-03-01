import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout, DashboardLayout } from '@/layouts'
import { LoginPage } from '@/pages/public'
import { DashboardPage } from '@/pages/dashboard'
// import { ProtectedRoute } from '@/routes/ProtectedRoute'

/**
 * Routes: login (public); root is dashboard (protected, redirects to login if unauthenticated).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* <Route element={<ProtectedRoute />}> */}
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
      </Route>
      {/* </Route> */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
