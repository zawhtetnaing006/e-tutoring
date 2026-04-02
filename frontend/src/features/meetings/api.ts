import { apiClient, ApiError } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

export type MeetingSchedule = {
  id: number
  meeting_id: number
  date: string
  start_time: string
  end_time: string
  note: string | null
  cancel_at: string | null
  created_at: string
  updated_at: string
}

export type MeetingAttendance = {
  id: number
  meeting_id: number
  meeting_schedule_id: number
  user_id: number
  status: 'PRESENCE' | 'ABSENCE' | 'ON_LEAVE'
  created_at: string
  updated_at: string
}

export type Meeting = {
  id: number
  title: string
  description: string | null
  type: 'VIRTUAL' | 'PHYSICAL'
  platform: string | null
  link: string | null
  location: string | null
  tutor_assignment_id: number
  tutor_user_id: number | null
  student_user_id: number | null
  tutor_name: string | null
  student_name: string | null
  schedule_count?: number | null
  meeting_schedules: MeetingSchedule[]
  created_at: string
  updated_at: string
}

export type MeetingScheduleListMeeting = Omit<Meeting, 'meeting_schedules'> & {
  schedule_count: number | null
}

export type MeetingScheduleListItem = MeetingSchedule & {
  meeting: MeetingScheduleListMeeting | null
}

export type MeetingDetails = Meeting & {
  selected_schedule_id: number | null
  student_attendance: MeetingAttendance | null
  attendance_locked: boolean
}

export type MeetingsResponse = {
  data: Meeting[]
  current_page: number
  total_page: number
  total_items: number
}

export type GetMeetingsParams = {
  page?: number
  per_page?: number
}

export type MeetingSchedulesResponse = {
  data: MeetingScheduleListItem[]
  current_page: number
  total_page: number
  total_items: number
}

export type CreateMeetingScheduleInput = {
  date: string
  start_time: string
  end_time: string
}

export type CreateMeetingPayload = {
  title: string
  description?: string | null
  type: 'VIRTUAL' | 'PHYSICAL'
  platform?: string | null
  link?: string | null
  location?: string | null
  tutor_assignment_id: number
  meeting_schedules: CreateMeetingScheduleInput[]
}

export type UpdateMeetingPayload = {
  title?: string
  description?: string | null
  type?: 'VIRTUAL' | 'PHYSICAL'
  platform?: string | null
  link?: string | null
  location?: string | null
  tutor_assignment_id?: number
}

export type UpdateMeetingSchedulePayload = {
  date?: string
  start_time?: string
  end_time?: string
  note?: string | null
}

export type CreateMeetingAttendancePayload = {
  meeting_schedule_id: number
  user_id: number
  status: 'PRESENCE' | 'ABSENCE' | 'ON_LEAVE'
}

function getToken() {
  const session = getAuthSession()
  if (!session?.token) {
    throw new ApiError(401, 'Not authenticated')
  }
  return session.token
}

export async function getMeetings(
  params: GetMeetingsParams = {}
): Promise<MeetingsResponse> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.per_page != null)
    searchParams.set('per_page', String(params.per_page))

  const path = searchParams.toString()
    ? `meetings?${searchParams.toString()}`
    : 'meetings'

  return apiClient<MeetingsResponse>(path, {
    method: 'GET',
    token: getToken(),
  })
}

export async function getMeetingSchedules(
  params: GetMeetingsParams = {}
): Promise<MeetingSchedulesResponse> {
  const searchParams = new URLSearchParams()
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.per_page != null)
    searchParams.set('per_page', String(params.per_page))

  const path = searchParams.toString()
    ? `meeting-schedules?${searchParams.toString()}`
    : 'meeting-schedules'

  return apiClient<MeetingSchedulesResponse>(path, {
    method: 'GET',
    token: getToken(),
  })
}

export async function getMeeting(meetingId: number): Promise<Meeting> {
  return apiClient<Meeting>(`meetings/${meetingId}`, {
    method: 'GET',
    token: getToken(),
  })
}

export async function getMeetingDetails(
  meetingId: number,
  scheduleId?: number | null
): Promise<MeetingDetails> {
  const path =
    scheduleId != null
      ? `meetings/${meetingId}/details?schedule_id=${scheduleId}`
      : `meetings/${meetingId}/details`

  return apiClient<MeetingDetails>(path, {
    method: 'GET',
    token: getToken(),
  })
}

export async function createMeeting(
  payload: CreateMeetingPayload
): Promise<Meeting> {
  return apiClient<Meeting>('meetings', {
    method: 'POST',
    token: getToken(),
    body: payload,
  })
}

export async function updateMeeting(
  meetingId: number,
  payload: UpdateMeetingPayload
): Promise<Meeting> {
  return apiClient<Meeting>(`meetings/${meetingId}`, {
    method: 'PUT',
    token: getToken(),
    body: payload,
  })
}

export async function deleteMeeting(meetingId: number): Promise<void> {
  await apiClient<null>(`meetings/${meetingId}`, {
    method: 'DELETE',
    token: getToken(),
  })
}

export async function updateMeetingSchedule(
  scheduleId: number,
  payload: UpdateMeetingSchedulePayload
): Promise<MeetingSchedule> {
  return apiClient<MeetingSchedule>(`meeting-schedules/${scheduleId}`, {
    method: 'PUT',
    token: getToken(),
    body: payload,
  })
}

export async function cancelMeetingSchedule(
  scheduleId: number
): Promise<MeetingSchedule> {
  return apiClient<MeetingSchedule>(`meeting-schedules/${scheduleId}/cancel`, {
    method: 'POST',
    token: getToken(),
  })
}

export async function createMeetingAttendance(
  payload: CreateMeetingAttendancePayload
): Promise<MeetingAttendance> {
  return apiClient<MeetingAttendance>('meeting-attendances', {
    method: 'POST',
    token: getToken(),
    body: payload,
  })
}
