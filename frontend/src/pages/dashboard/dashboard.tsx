import { useRole } from '@/features/auth/useRole'
import { StaffDashboard } from './StaffDashboard'
import { StudentDashboard } from './StudentDashboard'
import { TutorDashboard } from './TutorDashboard'

export function DashboardPage() {
  const role = useRole()

  if (role === 'staff') {
    return <StaffDashboard />
  }

  if (role === 'student') {
    return <StudentDashboard />
  }

  if (role === 'tutor') {
    return <TutorDashboard />
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
        Dashboard
      </h1>
      <p className="max-w-2xl text-sm text-muted-foreground sm:text-body">
        Welcome to the E-Tutor System
      </p>
    </div>
  )
}
