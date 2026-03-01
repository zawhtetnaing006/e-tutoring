import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout, DashboardLayout } from '@/layouts'
import {
  ForgotPasswordPage,
  LoginPage,
  PasswordResetCodePage,
  ResetPasswordPage,
} from '@/pages/public'
import { DashboardPage } from '@/pages/dashboard'
import { SettingsPage } from '@/pages/settings'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

/**
 * Routes: login (public); root is dashboard (protected, redirects to login if unauthenticated).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/password-reset/code"
          element={<PasswordResetCodePage />}
        />
        <Route path="/password-reset/new" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
