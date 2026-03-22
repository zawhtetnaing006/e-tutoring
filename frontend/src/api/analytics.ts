import { apiClient } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type AnalyticsResponse = {
  lastSevenDaysMessage: number
  meetingSchedules: number
  documentShares: number
  lastActiveAt: string
  personalTutor: {
    image: {
      width: number
      height: number
      url: string
    }
  }
  upcomingMeeting: {
    id: number
    title: string
    date: string
    from: string
    to: string
    platform: string
  }
  lastblogs: Array<{
    id: number
    title: string
    description: string
    tags: string[]
  }>
}

/**
 * GET /api/analytics - Returns analytics data for the dashboard
 * Requires authentication token
 */
export function getAnalytics(): Promise<AnalyticsResponse> {
  const session = getAuthSession()

  return apiClient<AnalyticsResponse>('analytics', {
    method: 'GET',
    token: session?.token || null,
  })
}
