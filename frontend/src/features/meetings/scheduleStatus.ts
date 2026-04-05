import type { MeetingSchedule } from '@/features/meetings/api'

export type MeetingScheduleStatus =
  | 'upcoming'
  | 'today'
  | 'ongoing'
  | 'previous'
  | 'cancelled'

type ScheduleForStatus = Pick<
  MeetingSchedule,
  'date' | 'start_time' | 'end_time' | 'cancel_at'
>

export function getMeetingScheduleStatus(
  schedule: ScheduleForStatus,
  now: Date = new Date()
): MeetingScheduleStatus {
  if (schedule.cancel_at) {
    return 'cancelled'
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

  if (schedule.date < todayStr) {
    return 'previous'
  }
  if (schedule.date > todayStr) {
    return 'upcoming'
  }
  if (nowTime >= schedule.start_time && nowTime <= schedule.end_time) {
    return 'ongoing'
  }
  if (nowTime > schedule.end_time) {
    return 'previous'
  }
  return 'today'
}

export function meetingScheduleStatusBadgeClassName(
  status: MeetingScheduleStatus
): string {
  switch (status) {
    case 'ongoing':
      return 'bg-green-500/10 text-green-600'
    case 'today':
      return 'bg-sky-500/10 text-sky-600'
    case 'upcoming':
      return 'bg-blue-500/10 text-blue-600'
    case 'previous':
      return 'bg-emerald-500/10 text-emerald-600'
    case 'cancelled':
      return 'bg-gray-500/10 text-gray-600'
  }
}

export function meetingScheduleStatusLabel(
  status: MeetingScheduleStatus
): string {
  switch (status) {
    case 'ongoing':
      return 'Ongoing'
    case 'today':
      return 'Today'
    case 'upcoming':
      return 'Upcoming'
    case 'previous':
      return 'Previous'
    case 'cancelled':
      return 'Cancelled'
  }
}
