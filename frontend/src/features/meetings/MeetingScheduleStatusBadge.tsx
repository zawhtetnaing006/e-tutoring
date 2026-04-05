import { Clock } from 'lucide-react'
import type { MeetingSchedule } from '@/features/meetings/api'
import {
  getMeetingScheduleStatus,
  meetingScheduleStatusBadgeClassName,
  meetingScheduleStatusLabel,
} from '@/features/meetings/scheduleStatus'

type MeetingScheduleStatusBadgeProps = {
  schedule: Pick<
    MeetingSchedule,
    'date' | 'start_time' | 'end_time' | 'cancel_at'
  >
}

export function MeetingScheduleStatusBadge({
  schedule,
}: MeetingScheduleStatusBadgeProps) {
  const status = getMeetingScheduleStatus(schedule)

  return (
    <span
      className={`flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meetingScheduleStatusBadgeClassName(status)}`}
    >
      <Clock className="mr-1 inline h-3 w-3" />
      {meetingScheduleStatusLabel(status)}
    </span>
  )
}
