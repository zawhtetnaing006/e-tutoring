import { Calendar, FileText, Clock, User, MessagesSquare } from 'lucide-react'
import { LastLoginBanner } from '@/components/dashboard/LastLoginBanner'
import { StatCard } from '@/components/dashboard/StatCard'
import { LatestBlogsSection } from '@/components/dashboard/LatestBlogsSection'
import { DashboardWelcomeCard } from '@/components/dashboard/DashboardWelcomeCard'
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader'
import {
  DashboardErrorState,
  DashboardLoadingState,
} from '@/components/dashboard/DashboardStates'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatLastLoginDisplay } from '@/utils/formatters'
import { useAnalytics, useDashboardWelcomeFirstVisit } from '@/hooks'
import { useCurrentUser } from '@/features/auth'
import type { StudentAnalyticsPayload } from '@/api/analytics'

export function StudentDashboard() {
  const { data, loading, error } = useAnalytics()
  const { data: user } = useCurrentUser()
  const showWelcomeCard = useDashboardWelcomeFirstVisit(user?.id)
  const analytics = data as StudentAnalyticsPayload | null

  if (loading) {
    return <DashboardLoadingState />
  }

  if (error) {
    return <DashboardErrorState message={error.message} />
  }

  if (!analytics) {
    return null
  }

  const upcoming = analytics.upcomingMeetings[0]
  const lastLoginRaw = analytics.lastLoginAt ?? analytics.lastActiveAt
  const lastLoginDisplay = formatLastLoginDisplay(lastLoginRaw)

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <LastLoginBanner
        lastLoginAt={analytics.lastLoginAt ?? analytics.lastActiveAt ?? null}
      />

      {showWelcomeCard && (
        <DashboardWelcomeCard
          heading={<>Welcome back, {user?.name || 'Student'}</>}
        >
          <p className="mt-1 text-xs text-gray-700 sm:text-sm">
            We are glad to see you again. Your last login was on{' '}
            <span className="font-medium">{lastLoginDisplay}</span>.
          </p>
          <p className="mt-1 text-xs text-gray-700 sm:text-sm">
            Please check your messages and upcoming{' '}
            <span className="font-medium text-blue-700">meetings</span> with
            your personal tutor.
          </p>
        </DashboardWelcomeCard>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<MessagesSquare className="size-6 sm:size-8" />}
          label="Messages (last 7 days)"
          value={analytics.lastSevenDaysMessage.toString()}
          variant="default"
        />
        <StatCard
          icon={<Calendar className="size-6 sm:size-8" />}
          label="Meetings scheduled"
          value={analytics.meetingSchedules.toString()}
          variant="success"
        />
        <StatCard
          icon={<FileText className="size-6 sm:size-8" />}
          label="Document Shared"
          value={analytics.documentShares.toString()}
          variant="warning"
        />
        <StatCard
          icon={<Clock className="size-6 sm:size-8" />}
          label="Last Interaction"
          isValueDate
          value={analytics.lastActiveAt}
          variant="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <Card className="min-w-0 p-4 sm:p-6">
          <DashboardSectionHeader title="My Personal Tutor" />
          {analytics.personalTutor ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {analytics.personalTutor.avatar.url ? (
                <img
                  src={analytics.personalTutor.avatar.url}
                  alt={analytics.personalTutor.name}
                  className="mx-auto size-16 shrink-0 rounded-full object-cover sm:mx-0 sm:size-20"
                />
              ) : (
                <div className="mx-auto flex size-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700 sm:mx-0 sm:size-20">
                  {analytics.personalTutor.avatar.initials}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                <h4 className="text-base font-semibold text-gray-900 sm:text-lg">
                  {analytics.personalTutor.name}
                </h4>
                {analytics.personalTutor.headline ? (
                  <p className="text-sm text-gray-600">
                    {analytics.personalTutor.headline}
                  </p>
                ) : null}
                <p className="break-all text-sm text-gray-600">
                  {analytics.personalTutor.email}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No tutor assigned yet.</p>
          )}
          <div className="mt-6 flex justify-center sm:justify-start">
            <Button variant="primary" className="w-full min-[400px]:w-auto">
              Message Tutor
            </Button>
          </div>
        </Card>

        <Card className="min-w-0 p-4 sm:p-6">
          <DashboardSectionHeader
            title="Upcoming Meetings"
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
            {upcoming && upcoming.title ? (
              <div className="flex flex-col gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:flex-row sm:items-start sm:p-4">
                <div className="mx-auto flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white sm:mx-0 sm:size-12">
                  {upcoming.title
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="mb-2 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                    <h4 className="font-semibold text-gray-900">
                      {upcoming.title}
                    </h4>
                    <Badge variant="primary" className="shrink-0">
                      Upcoming
                    </Badge>
                  </div>
                  <p className="flex items-center justify-center gap-1 text-sm text-gray-700 sm:justify-start">
                    <Calendar className="size-4 shrink-0" aria-hidden />
                    {upcoming.date}
                  </p>
                  <p className="flex items-center justify-center gap-1 text-sm text-gray-700 sm:justify-start">
                    <Clock className="size-4 shrink-0" aria-hidden />
                    {upcoming.from} - {upcoming.to}
                  </p>
                  <p className="mt-2 flex items-center justify-center gap-1 text-sm text-gray-700 sm:justify-start">
                    <User className="size-4 shrink-0" aria-hidden />
                    {upcoming.platform ?? '—'}
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
            ) : (
              <p className="text-sm text-gray-500">No upcoming meetings</p>
            )}
          </div>
        </Card>
      </div>

      <LatestBlogsSection blogs={analytics.latestBlogs ?? []} />
    </div>
  )
}
