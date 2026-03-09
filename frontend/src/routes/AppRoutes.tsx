import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout, DashboardLayout } from '@/layouts'
import {
  ForgotPasswordPage,
  LoginPage,
  PasswordResetCodePage,
  ResetPasswordPage,
} from '@/pages/public'
import { DashboardPage } from '@/pages/dashboard'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { ProfilePage } from '@/pages/profile'
import { AllocationsPage } from '@/pages/allocations'
import { CommunicationHubPage } from '@/pages/communication-hub'
import { PlaceholderPage } from '@/components/common/PlaceholderPage'

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
          <Route path="staffs" element={<PlaceholderPage title="Staffs" />} />
          <Route path="tutors" element={<PlaceholderPage title="Tutors" />} />
          <Route
            path="students"
            element={<PlaceholderPage title="Students" />}
          />
          <Route
            path="subjects"
            element={<PlaceholderPage title="Subjects" />}
          />
          <Route path="allocations" element={<AllocationsPage />} />
          <Route
            path="meeting-manager"
            element={<PlaceholderPage title="Meeting Manager" />}
          />
          <Route path="blogs" element={<PlaceholderPage title="Blogs" />} />
          <Route path="communication-hub" element={<CommunicationHubPage />} />
          <Route
            path="notifications"
            element={<PlaceholderPage title="Notifications" />}
          />
          <Route
            path="audit-log"
            element={<PlaceholderPage title="Audit Log" />}
          />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
