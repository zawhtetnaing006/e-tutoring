import { useMemo } from 'react'
import { Users, AlertTriangle, UserMinus } from 'lucide-react'
import { LastLoginBanner } from '@/components/dashboard/LastLoginBanner'
import { StatCard } from '@/components/dashboard/StatCard'
import { LatestBlogsSection } from '@/components/dashboard/LatestBlogsSection'
import { DashboardWelcomeCard } from '@/components/dashboard/DashboardWelcomeCard'
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader'
import { DashboardViewAllLink } from '@/components/dashboard/DashboardViewAllLink'
import {
  DashboardErrorState,
  DashboardLoadingState,
} from '@/components/dashboard/DashboardStates'
import type { ResponsiveTableColumn } from '@/components/dashboard/ResponsiveTable'
import { ResponsiveTable } from '@/components/dashboard/ResponsiveTable'
import { Card } from '@/components/ui/Card'
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
import { formatLastLoginDisplay } from '@/utils/formatters'
import {
  PAGE_AXIS_MAX,
  TUTOR_AXIS_MAX,
  truncateChartLabel,
} from '@/utils/chart'
import {
  useAnalytics,
  useDashboardWelcomeFirstVisit,
  useMediaQuery,
} from '@/hooks'
import { useCurrentUser } from '@/features/auth'
import type {
  GaBrowserRow,
  MostActiveUserRow,
  RecentAllocationRow,
  StaffAnalyticsPayload,
} from '@/api/analytics'

const BROWSER_PIE_COLORS = [
  '#5B8FF9',
  '#5AD8A6',
  '#F6BD16',
  '#E8684A',
  '#6B7EB8',
  '#9DD4A8',
  '#C8A2E8',
  '#F0A870',
] as const

function browsersWithColors(rows: GaBrowserRow[]) {
  return rows.map((row, index) => ({
    ...row,
    color: BROWSER_PIE_COLORS[index % BROWSER_PIE_COLORS.length],
  }))
}

const mostActiveColumns: ResponsiveTableColumn<MostActiveUserRow>[] = [
  {
    id: 'user',
    header: 'User',
    cell: row => (
      <span className="font-medium text-gray-900">{row.userName}</span>
    ),
  },
  { id: 'role', header: 'Role', cell: row => row.role },
  { id: 'logins', header: 'Login Count', cell: row => row.loginCount },
  { id: 'messages', header: 'Messages Sent', cell: row => row.messagesSent },
  { id: 'last', header: 'Last Active', cell: row => row.lastActive },
]

const allocationColumns: ResponsiveTableColumn<RecentAllocationRow>[] = [
  {
    id: 'tutor',
    header: 'Tutor',
    cell: row => row.tutor?.name ?? '—',
  },
  {
    id: 'student',
    header: 'Student',
    cell: row => row.student?.name ?? '—',
  },
  {
    id: 'semester',
    header: 'Semester Period',
    cell: row => row.semesterPeriod.label,
  },
]

export function StaffDashboard() {
  const { data, loading, error } = useAnalytics()
  const { data: user } = useCurrentUser()
  const showWelcomeCard = useDashboardWelcomeFirstVisit(user?.id)
  const analytics = data as StaffAnalyticsPayload | null
  const isSm = useMediaQuery('(min-width: 640px)')

  const messagesData =
    analytics?.messageByTutorLast7Days.map(r => ({
      name: r.tutorName,
      messages: r.messagesCount,
    })) ?? []

  const messagesChartHeight = useMemo(
    () =>
      messagesData.length === 0
        ? 200
        : Math.min(480, Math.max(220, messagesData.length * 52)),
    [messagesData.length]
  )

  const tuteesData =
    analytics?.tuteesPerTutor.map(r => ({
      name: r.tutorName,
      tutees: r.tuteesCount,
    })) ?? []

  const mostActiveUsers = analytics?.mostActiveUsers.slice(0, 5) ?? []
  const recentAllocations = analytics?.recentAllocations.slice(0, 5) ?? []

  const pageViewsData = analytics?.mostViewedPages ?? []
  const browsersForChart = useMemo(
    () => browsersWithColors(analytics?.browsersUsed ?? []),
    [analytics?.browsersUsed]
  )
  const browsersTotal = useMemo(
    () => browsersForChart.reduce((sum, b) => sum + b.value, 0),
    [browsersForChart]
  )

  const tutorYAxisWidth = isSm ? 120 : 72
  const pieInner = isSm ? 72 : 52
  const pieOuter = isSm ? 118 : 88

  if (loading) {
    return <DashboardLoadingState />
  }

  if (error) {
    return <DashboardErrorState message={error.message} />
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <LastLoginBanner lastLoginAt={analytics.lastLoginAt} />

      {showWelcomeCard && (
        <DashboardWelcomeCard
          heading={
            <>Welcome, {analytics.displayName || user?.name || 'Staff'}</>
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
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="size-6 sm:size-8" />}
          label="Total Students"
          value={analytics.totalStudents.toString()}
          variant="success"
        />
        <StatCard
          icon={<UserMinus className="size-6 sm:size-8" />}
          label="Students Without Tutor"
          value={analytics.studentsWithoutTutor.toString()}
          variant="danger"
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

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
          <Card className="min-w-0 p-4 sm:p-6">
            <DashboardSectionHeader title="Most Viewed Pages" />
            <p className="-mt-2 mb-3 text-xs text-gray-500">
              Last 90 days · Google Analytics
            </p>
            <div className="h-[240px] w-full xs:h-[260px] sm:h-[300px]">
              {pageViewsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pageViewsData}
                    margin={{
                      top: 8,
                      right: 8,
                      left: 0,
                      bottom: isSm ? 40 : 48,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: isSm ? 11 : 10 }}
                      interval={0}
                      angle={isSm ? -32 : -45}
                      textAnchor="end"
                      height={isSm ? 52 : 60}
                      tickMargin={4}
                      tickFormatter={v => truncateChartLabel(v, PAGE_AXIS_MAX)}
                    />
                    <YAxis tick={{ fontSize: 11 }} width={isSm ? 44 : 36} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#5B8FF9" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-center text-sm text-gray-500">
                  No data from GA4 yet (this chart uses the server Data API on{' '}
                  <code className="text-xs">GET /api/analytics</code>
                  ). Confirm hits in the GA4 property, allow 24–48h for reports,
                  and restart <code className="text-xs">npm run dev</code> after
                  changing{' '}
                  <code className="text-xs">VITE_GA_MEASUREMENT_ID</code>.
                </p>
              )}
            </div>
          </Card>

          <Card className="min-w-0 p-4 sm:p-6">
            <DashboardSectionHeader title="Browsers Used" />
            <p className="-mt-2 mb-3 text-xs text-gray-500">
              Last 90 days · Google Analytics
            </p>
            <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="h-[240px] w-full max-w-[min(100%,340px)] sm:h-[300px]">
                {browsersForChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[...browsersForChart]}
                        cx="50%"
                        cy="50%"
                        innerRadius={pieInner}
                        outerRadius={pieOuter}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={false}
                      >
                        {browsersForChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-center text-sm text-gray-500">
                    No browser breakdown from GA4 yet (same Data API as above).
                    Check DevTools → Network for{' '}
                    <code className="text-xs">googletagmanager</code> /{' '}
                    <code className="text-xs">google-analytics</code> (disable
                    ad blockers while testing).
                  </p>
                )}
              </div>
              <div className="w-full space-y-2 lg:max-w-[220px]">
                {browsersForChart.map((browser, index) => {
                  const pct =
                    browsersTotal > 0
                      ? ((browser.value / browsersTotal) * 100).toFixed(0)
                      : '0'
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div
                        className="size-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: browser.color }}
                      />
                      <span className="text-gray-700">
                        {browser.name} {pct}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <Card className="min-w-0 p-4 sm:p-6">
          <DashboardSectionHeader title="Message by Tutor (Last 7 days)" />
          <div className="w-full" style={{ height: messagesChartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messagesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={tutorYAxisWidth}
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => truncateChartLabel(v, TUTOR_AXIS_MAX)}
                />
                <Tooltip />
                <Bar dataKey="messages" fill="#5AD8A6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {messagesData.length === 0 ? (
            <p className="mt-2 text-center text-sm text-gray-500">
              No tutor messages in the last 7 days
            </p>
          ) : null}
        </Card>

        <Card className="min-w-0 p-4 sm:p-6">
          <DashboardSectionHeader title="Tutees per Tutor" />
          <div className="h-[240px] w-full sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tuteesData}
                margin={{ top: 8, right: 8, left: 0, bottom: isSm ? 44 : 52 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={isSm ? -32 : -45}
                  textAnchor="end"
                  height={isSm ? 56 : 64}
                  tickMargin={4}
                  tickFormatter={v => truncateChartLabel(v, TUTOR_AXIS_MAX)}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tutees" fill="#5AD8A6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {tuteesData.length === 0 ? (
            <p className="mt-2 text-center text-sm text-gray-500">
              No active tutor assignments to summarize
            </p>
          ) : null}
        </Card>
      </div>

      <Card className="min-w-0 p-4 sm:p-6">
        <DashboardSectionHeader title="Most Active Users" />
        <ResponsiveTable
          columns={mostActiveColumns}
          rows={mostActiveUsers}
          emptyMessage="No activity data to rank users yet"
          getRowKey={row => row.userId}
          tableClassName="w-full min-w-[720px]"
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 p-4 sm:p-6">
          <DashboardSectionHeader
            title="Recent Allocations"
            action={<DashboardViewAllLink to="/allocations" />}
          />
          <ResponsiveTable
            columns={allocationColumns}
            rows={recentAllocations}
            emptyMessage="No recent allocations"
            getRowKey={row => row.allocationId}
            tableClassName="w-full min-w-[520px]"
          />
        </Card>

        <LatestBlogsSection
          blogs={analytics.latestBlogs ?? []}
          previewCount={1}
        />
      </div>
    </div>
  )
}
