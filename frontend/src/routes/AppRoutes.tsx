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
import { StaffsListPage } from '@/pages/staffs'
import { StudentsListPage } from '@/pages/students'
import { TutorsListPage } from '@/pages/tutors'
import { SubjectsListPage } from '@/pages/subjects'
import { AllocationsPage } from '@/pages/allocations'
import { MeetingManagerPage } from '@/pages/meetings'
import { CommunicationHubPage } from '@/pages/communication-hub'
import { BlogsPage } from '@/pages/blogs'
import { NotificationsPage } from '@/pages/notifications'
import { AuditLogPage } from '@/pages/audit-log'
import { TestGaEnvPage } from '@/pages/test-ga-env'

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
        <Route path="/test-ga-env" element={<TestGaEnvPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="staffs" element={<StaffsListPage />} />
          <Route path="tutors" element={<TutorsListPage />} />
          <Route path="students" element={<StudentsListPage />} />
          <Route path="subjects" element={<SubjectsListPage />} />
          <Route path="allocations" element={<AllocationsPage />} />
          <Route path="meeting-manager" element={<MeetingManagerPage />} />
          <Route path="blogs" element={<BlogsPage />} />
          <Route path="communication-hub" element={<CommunicationHubPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
