import { apiClient } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type SemesterPeriod = {
  from: string
  to: string
  label: string
}

export type BlogAuthor = {
  id: number
  uuid: string
  name: string
  role_code: string | null
}

export type LatestBlogPost = {
  id: number
  title: string
  description: string
  tags: string[]
  coverImageUrl: string | null
  viewCount: number
  commentCount: number
  created_at: string
  author: BlogAuthor | null
}

export type StudentPersonalTutor = {
  id: number
  uuid: string
  name: string
  headline: string | null
  email: string
  phone: string | null
  is_active: boolean
  avatar: { url: string | null; initials: string }
  subjects: string[]
  assignment: {
    id: number
    from: string
    to: string
    status: string
  }
  /** DM with tutor; null if no conversation exists yet */
  conversationId: number | null
}

export type UpcomingMeetingItem = {
  id: number
  title: string | null
  date: string
  from: string
  to: string
  platform: string | null
}

export type StudentAnalyticsPayload = {
  lastSevenDaysMessage: number
  meetingSchedules: number
  documentShares: number
  lastLoginAt: string | null
  lastActiveAt: string
  personalTutor: StudentPersonalTutor | null
  upcomingMeetings: UpcomingMeetingItem[]
  latestBlogs: LatestBlogPost[]
}

export type TutorStudentRow = {
  studentId: number | null
  studentUuid: string | null
  studentName: string | null
  semesterPeriod: SemesterPeriod
  lastInteractionAt: string | null
  lastInteractionIso: string | null
  conversationId: number | null
}

export type TutorWeeklyMeeting = {
  meetingId: number
  scheduleId: number
  title: string
  studentId: number | null
  studentName: string | null
  date: string
  from: string
  to: string
  platform: string | null
  status: string
}

export type TutorAnalyticsPayload = {
  lastLoginAt: string | null
  displayName: string
  welcomeSubtitle: string
  totalTutees: number
  messagesLast7Days: number
  noInteractionStudents7PlusDays: number
  noInteractionStudents28PlusDays: number
  myStudents: TutorStudentRow[]
  thisWeeksMeetingsCount: number
  thisWeeksMeetings: TutorWeeklyMeeting[]
  latestBlogs: LatestBlogPost[]
}

export type MessageByTutorRow = {
  tutorId: number
  tutorUuid: string
  tutorName: string
  messagesCount: number
}

export type TuteesPerTutorRow = {
  tutorId: number
  tutorUuid: string
  tutorName: string
  tuteesCount: number
}

export type RecentAllocationRow = {
  allocationId: number
  tutor: { id: number; uuid: string; name: string } | null
  student: { id: number; uuid: string; name: string } | null
  semesterPeriod: SemesterPeriod
  status: string
}

export type MostActiveUserRow = {
  userId: number
  userUuid: string
  userName: string
  role: string
  loginCount: number
  messagesSent: number
  lastActive: string
}

export type GaPageViewsRow = {
  name: string
  views: number
}

export type GaBrowserRow = {
  name: string
  value: number
}

export type StaffAnalyticsPayload = {
  lastLoginAt: string | null
  displayName: string
  welcomeSubtitle: string
  totalStudents: number
  studentsWithoutTutor: number
  noInteractionStudents7PlusDays: number
  noInteractionStudents28PlusDays: number
  messageByTutorLast7Days: MessageByTutorRow[]
  tuteesPerTutor: TuteesPerTutorRow[]
  mostActiveUsers: MostActiveUserRow[]
  recentAllocations: RecentAllocationRow[]
  latestBlogs: LatestBlogPost[]
  /** GA4 last 30 days; human-readable page names (e.g. Dashboard, Notifications) */
  mostViewedPages: GaPageViewsRow[]
  /** GA4 last 30 days; screen views by browser */
  browsersUsed: GaBrowserRow[]
}

export type AnalyticsResponse =
  | StudentAnalyticsPayload
  | TutorAnalyticsPayload
  | StaffAnalyticsPayload

/**
 * GET /api/analytics - Returns analytics data for the dashboard
 * Requires authentication token
 */
export function getAnalytics(options?: {
  /** Avoid stale JSON when the user clicks Refresh (proxies/CDN). */
  cacheBust?: boolean
}): Promise<AnalyticsResponse> {
  const session = getAuthSession()
  const suffix = options?.cacheBust ? `?t=${Date.now()}` : ''

  return apiClient<AnalyticsResponse>(`analytics${suffix}`, {
    method: 'GET',
    token: session?.token || null,
  })
}
