import { Users, AlertTriangle, MessageSquare, UserMinus } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { useAnalytics } from '@/hooks'
import { useCurrentUser } from '@/features/auth'

const pageViewsData = [
  { name: 'Dashboard', views: 100 },
  { name: 'Staff', views: 45 },
  { name: 'Student', views: 70 },
  { name: 'Subject', views: 50 },
  { name: 'Meetings', views: 85 },
  { name: 'Blogs', views: 75 },
  { name: 'Comm-Hub', views: 95 },
  { name: 'Notification', views: 65 },
]

const browsersData = [
  { name: 'Chrome', value: 100, color: '#5B8FF9' },
  { name: 'Edge', value: 62, color: '#5AD8A6' },
  { name: 'Firefox', value: 62, color: '#F6BD16' },
  { name: 'Safari', value: 50, color: '#E8684A' },
]

const messagesData = [
  { name: 'Dr. Michael Grant', messages: 75 },
  { name: 'Ms. Natalie Brooks', messages: 45 },
  { name: 'Dr. Isabelle Reed', messages: 60 },
]

const tuteesData = [
  { name: 'Mr. Ethan Foster', tutees: 80 },
  { name: 'Dr. Isabella Reed', tutees: 45 },
  { name: 'Dr. Lucas Bennett', tutees: 60 },
]

const recentAllocations = [
  {
    tutor: 'Dr. Michael Grant',
    student: 'Aiden Murphy',
    semester: '2026-01-15/2026-05-15',
  },
  {
    tutor: 'Ms. Natalie Brooks',
    student: 'Sophia Nguyen',
    semester: '2026-01-15/2026-05-15',
  },
]

const activeUsers = [
  {
    user: 'Emma Wilson',
    role: 'Student',
    loginCount: 32,
    messages: 2,
    lastActive: '2026-02-26 14:30',
  },
  {
    user: 'Dr. Sarah Johnson',
    role: 'Tutor',
    loginCount: 15,
    messages: 1,
    lastActive: '2026-02-27 09:30',
  },
  {
    user: 'John Mathes',
    role: 'Admin',
    loginCount: 37,
    messages: 0,
    lastActive: '2026-02-27 08:30',
  },
]

export function StaffDashboard() {
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
              Welcome back, {user?.name || 'Staff'}
            </h2>
            <p className="mt-1 text-xs text-gray-700 sm:text-sm">
              Last login:{' '}
              <span className="font-medium">{analytics.lastActiveAt}</span>
            </p>
            <p className="mt-1 text-xs text-gray-700 sm:text-sm">
              System reports and monitoring tools are available in your
              dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="size-6 sm:size-8" />}
          label="Total Students"
          value="3"
          variant="success"
        />
        <StatCard
          icon={<UserMinus className="size-6 sm:size-8" />}
          label="Students Without Tutor"
          value="0"
          variant="danger"
        />
        <StatCard
          icon={<AlertTriangle className="size-6 sm:size-8" />}
          label="Inactive Students (7 days)"
          value="32"
          variant="warning"
        />
        <StatCard
          icon={<AlertTriangle className="size-6 sm:size-8" />}
          label="Inactive Students (28+ days)"
          value="4"
          variant="danger"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Most Viewed Pages
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pageViewsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="views" fill="#5B8FF9" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Browsers Used
            </h3>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie
                  data={browsersData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {browsersData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {browsersData.map((browser, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div
                    className="size-3 rounded-sm"
                    style={{ backgroundColor: browser.color }}
                  />
                  <span className="text-gray-700">
                    {browser.name} {browser.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Message by Tutor (Last 7 days)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={messagesData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                dataKey="name"
                type="category"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar dataKey="messages" fill="#5AD8A6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Tutees per Tutor
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tuteesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="tutees" fill="#5AD8A6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
            Most Active Users
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-700">
                <th className="pb-3">User</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Login Count</th>
                <th className="pb-3">Messages Sent</th>
                <th className="pb-3">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map((user, index) => (
                <tr key={index} className="border-b border-gray-100 text-sm">
                  <td className="py-3 text-gray-900">{user.user}</td>
                  <td className="py-3 text-gray-700">{user.role}</td>
                  <td className="py-3 text-gray-700">{user.loginCount}</td>
                  <td className="py-3 text-gray-700">{user.messages}</td>
                  <td className="py-3 text-gray-700">{user.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Recent Allocations
            </h3>
            <Button
              variant="link"
              size="sm"
              className="self-start sm:self-auto"
            >
              View All →
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm font-medium text-gray-700">
                  <th className="pb-3">Tutor</th>
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Semester Period</th>
                </tr>
              </thead>
              <tbody>
                {recentAllocations.map((allocation, index) => (
                  <tr key={index} className="border-b border-gray-100 text-sm">
                    <td className="py-3 text-gray-900">{allocation.tutor}</td>
                    <td className="py-3 text-gray-700">{allocation.student}</td>
                    <td className="py-3 text-gray-700">
                      {allocation.semester}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
              Latest Blogs
            </h3>
            <Button
              variant="link"
              size="sm"
              className="self-start sm:self-auto"
            >
              View All →
            </Button>
          </div>
          {analytics.lastblogs && analytics.lastblogs.length > 0 ? (
            <div className="flex flex-col gap-4 sm:flex-row">
              <img
                src="/assets/blog-placeholder.jpg"
                alt={analytics.lastblogs[0].title}
                className="h-32 w-full rounded-lg object-cover sm:w-32"
                onError={e => {
                  e.currentTarget.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="%235B8FF9" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E'
                }}
              />
              <div className="flex-1 space-y-2">
                <h4 className="font-semibold text-gray-900">
                  {analytics.lastblogs[0].title}
                </h4>
                <p className="line-clamp-2 text-sm text-gray-600">
                  {analytics.lastblogs[0].description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {analytics.lastblogs[0].tags.map((tag, index) => (
                    <Badge key={index} variant="primary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No blogs available</p>
          )}
        </Card>
      </div>
    </div>
  )
}
