import { Navigate, Route, Routes } from 'react-router-dom'
import {
  PublicLayout,
  StudentDashboardLayout,
  TutorDashboardLayout,
  AdminDashboardLayout,
} from '@/layouts'
import { HomePage, LoginPage } from '@/pages/public'
import { StudentDashboardPage } from '@/pages/student'
import { TutorDashboardPage } from '@/pages/tutor'
import { AdminDashboardPage } from '@/pages/admin'

/**
 * Basic route config: public, student, tutor, admin (one dashboard each).
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route path="/student" element={<StudentDashboardLayout />}>
        <Route index element={<StudentDashboardPage />} />
      </Route>

      <Route path="/tutor" element={<TutorDashboardLayout />}>
        <Route index element={<TutorDashboardPage />} />
      </Route>

      <Route path="/admin" element={<AdminDashboardLayout />}>
        <Route index element={<AdminDashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
