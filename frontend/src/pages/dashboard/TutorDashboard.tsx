import {
  Users,
  Calendar,
  User,
  MessagesSquare,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { LastLoginBanner } from '@/components/dashboard/LastLoginBanner'
import { StatCard } from '@/components/dashboard/StatCard'
import { LatestBlogsSection } from '@/components/dashboard/LatestBlogsSection'
import { DashboardWelcomeCard } from '@/components/dashboard/DashboardWelcomeCard'
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader'
import {
  DashboardErrorState,
  DashboardLoadingState,
} from '@/components/dashboard/DashboardStates'
import type { ResponsiveTableColumn } from '@/components/dashboard/ResponsiveTable'
import { ResponsiveTable } from '@/components/dashboard/ResponsiveTable'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatLastLoginDisplay } from '@/utils/formatters'
import { useAnalytics } from '@/hooks'
import { useCurrentUser } from '@/features/auth'
import type { TutorAnalyticsPayload, TutorStudentRow } from '@/api/analytics'

const studentColumns: ResponsiveTableColumn<TutorStudentRow>[] = [
  {
    id: 'student',
    header: 'Student',
    cell: row => (
      <span className="font-medium text-gray-900">
        {row.studentName ?? '—'}
      </span>
    ),
  },
  {
    id: 'semester',
    header: 'Semester Period',
    cell: row => row.semesterPeriod.label,
  },
  {
    id: 'last',
    header: 'Last Interaction',
    cell: row => row.lastInteractionAt ?? '—',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <Button variant="link" size="sm">
        Message
      </Button>
    ),
  },
]

export function TutorDashboard() {
  const { data, loading, error } = useAnalytics()
  const { data: user } = useCurrentUser()
  const analytics = data as TutorAnalyticsPayload | null

  if (loading) {
    return <DashboardLoadingState />
  }

  if (error) {
    return <DashboardErrorState message={error.message} />
  }

  if (!analytics) {
    return null
  }

  const studentsPreview = analytics.myStudents.slice(0, 5)
  const meetingsPreview = analytics.thisWeeksMeetings.slice(0, 2)

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <LastLoginBanner lastLoginAt={analytics.lastLoginAt} />

      <DashboardWelcomeCard
        heading={
          <>Welcome back, {analytics.displayName || user?.name || 'Tutor'}</>
        }
      >
        <p className="mt-1 text-xs text-gray-700 sm:text-sm">
          We are glad to see you again. Your last login was on{' '}
          <span className="font-medium">
            {formatLastLoginDisplay(analytics.lastLoginAt)}
          </span>
          .
        </p>
        <p className="mt-1 text-xs text-gray-700 sm:text-sm">
          {analytics.welcomeSubtitle}
        </p>
      </DashboardWelcomeCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="size-6 sm:size-8" />}
          label="Total Tutees"
          value={analytics.totalTutees.toString()}
          variant="success"
        />
        <StatCard
          icon={<MessagesSquare className="size-6 sm:size-8" />}
          label="Messages (Last 7 days)"
          value={analytics.messagesLast7Days.toString()}
          variant="default"
        />
        <StatCard
          icon={<AlertTriangle className="size-6 sm:size-8" />}
          label="No Interaction Students (7 days)"
          value={analytics.noInteractionStudents7PlusDays.toString()}
          variant="warning"
        />
        <StatCard
          icon={<AlertTriangle className="size-6 sm:size-8" />}
          label="No Interaction Students (28+ days)"
          value={analytics.noInteractionStudents28PlusDays.toString()}
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <Card className="min-w-0 p-4 sm:p-6">
          <DashboardSectionHeader
            title="My Students"
            action={
              <Button
                variant="link"
                size="sm"
                className="self-start sm:self-auto"
              >
                View All →
              </Button>
            }
          />
          <ResponsiveTable
            columns={studentColumns}
            rows={studentsPreview}
            emptyMessage="No students assigned"
            getRowKey={(row, index) => row.studentId ?? index}
            tableClassName="w-full min-w-[500px]"
          />
        </Card>

        <Card className="min-w-0 p-4 sm:p-6">
          <DashboardSectionHeader
            title={
              <>
                This Week&apos;s Meetings
                {analytics.thisWeeksMeetingsCount >= 0
                  ? ` (${analytics.thisWeeksMeetingsCount})`
                  : ''}
              </>
            }
            action={
              <Button
                variant="link"
                size="sm"
                className="self-start sm:self-auto"
              >
                View All →
              </Button>
            }
          />
          <div className="space-y-3">
            {meetingsPreview.length === 0 ? (
              <p className="text-sm text-gray-500">No meetings this week</p>
            ) : (
              meetingsPreview.map(meeting => (
                <div
                  key={`${meeting.meetingId}-${meeting.scheduleId}`}
                  className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:flex-row sm:items-start sm:p-4"
                >
                  <div className="mx-auto flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white sm:mx-0 sm:size-12">
                    {meeting.title
                      .split(' ')
                      .map(w => w[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <div className="mb-2 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                      <h4 className="font-semibold text-gray-900">
                        {meeting.title}
                      </h4>
                      <Badge variant="primary" className="shrink-0">
                        {meeting.status}
                      </Badge>
                    </div>
                    {meeting.studentName ? (
                      <p className="mb-1 text-sm text-gray-600">
                        {meeting.studentName}
                      </p>
                    ) : null}
                    <p className="flex items-center justify-center gap-1 text-sm text-gray-700 sm:justify-start">
                      <Calendar className="size-4 shrink-0" aria-hidden />
                      {meeting.date}
                    </p>
                    <p className="flex items-center justify-center gap-1 text-sm text-gray-700 sm:justify-start">
                      <Clock className="size-4 shrink-0" aria-hidden />
                      {meeting.from} - {meeting.to}
                    </p>
                    <p className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-700 sm:justify-start">
                      <User className="size-4 shrink-0" aria-hidden />
                      {meeting.platform ?? '—'}
                    </p>
                    <div className="mt-3 flex justify-center sm:justify-start">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full min-[400px]:w-auto"
                      >
                        Click to view Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <LatestBlogsSection blogs={analytics.latestBlogs ?? []} />
    </div>
  )
}
