import {
  MessageSquare,
  Calendar,
  FileText,
  Clock,
  User,
  MessagesSquare,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAnalytics } from '@/hooks'
import { useCurrentUser } from '@/features/auth'

export function StudentDashboard() {
  const { data: analytics, loading, error } = useAnalytics()
  const { data: user } = useCurrentUser()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load dashboard data: {error.message}
        </p>
      </div>
    )
  }

  if (!analytics) {
    return null
  }
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <MessageSquare className="mt-0.5 size-4 shrink-0 text-blue-600 sm:size-5" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
              Welcome back, {user?.name || 'Student'}
            </h2>
            <p className="mt-1 text-xs text-gray-700 sm:text-sm">
              We are glad to see you again. Your last login was on{' '}
              <span className="font-medium">{analytics.lastActiveAt}</span>.
            </p>
            <p className="mt-1 text-xs text-gray-700 sm:text-sm">
              Please check your messages and upcoming{' '}
              <span className="font-medium text-blue-700">meetings</span> with
              your personal tutor.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              My Personal Tutor
            </h3>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {analytics.personalTutor?.image?.url ? (
              <img
                src={analytics.personalTutor.image.url}
                alt="Personal Tutor"
                className="size-16 shrink-0 rounded-full object-cover sm:size-20"
                onError={e => {
                  e.currentTarget.style.display = 'none'
                  const parent = e.currentTarget.parentElement
                  if (parent) {
                    const fallback = document.createElement('div')
                    fallback.className =
                      'flex size-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700 sm:size-20'
                    fallback.textContent = 'PT'
                    parent.insertBefore(fallback, e.currentTarget)
                  }
                }}
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700 sm:size-20">
                PT
              </div>
            )}
            <div className="flex-1 space-y-2">
              <h4 className="text-base font-semibold text-gray-900 sm:text-lg">
                Personal Tutor
              </h4>
              <p className="text-sm text-gray-600">Your assigned tutor</p>
            </div>
          </div>
          <div className="mt-4">
            <Button variant="primary" className="w-full sm:w-auto">
              Message Tutor
            </Button>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Upcoming Meetings
            </h3>
            <Button
              variant="link"
              size="sm"
              className="self-start sm:self-auto"
            >
              View All →
            </Button>
          </div>
          <div className="space-y-3">
            {analytics.upcomingMeeting ? (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white sm:size-12">
                  {analytics.upcomingMeeting.title
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <h4 className="font-semibold text-gray-900">
                      {analytics.upcomingMeeting.title}
                    </h4>
                    <Badge variant="primary">Upcoming</Badge>
                  </div>
                  <p className="flex items-center gap-1 text-sm text-gray-700">
                    <Calendar className="size-4 shrink-0" />
                    {analytics.upcomingMeeting.date}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-gray-700">
                    <Clock className="size-4 shrink-0" />
                    {analytics.upcomingMeeting.from} -{' '}
                    {analytics.upcomingMeeting.to}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-sm text-gray-700">
                    <User className="size-4 shrink-0" />
                    {analytics.upcomingMeeting.platform}
                  </p>
                  <div className="mt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full sm:w-auto"
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

      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
            Latest Blogs
          </h3>
          <Button variant="link" size="sm" className="self-start sm:self-auto">
            View All →
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {analytics.lastblogs && analytics.lastblogs.length > 0 ? (
            analytics.lastblogs.map(blog => (
              <div key={blog.id} className="flex flex-col gap-4 sm:flex-row">
                <img
                  src="/assets/blog-placeholder.jpg"
                  alt={blog.title}
                  className="h-32 w-full rounded-lg object-cover sm:w-32"
                  onError={e => {
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="%235B8FF9" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E'
                  }}
                />
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-gray-900">{blog.title}</h4>
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {blog.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {blog.tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="primary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No blogs available</p>
          )}
        </div>
      </Card>
    </div>
  )
}
