import { useMemo } from 'react'
import { LoaderCircle, Video, MapPin, Calendar, Clock } from 'lucide-react'
import type { Meeting, MeetingSchedule } from '@/features/meetings/api'

type ListViewProps = {
  meetings: Meeting[]
  isLoading: boolean
  onViewDetails: (meeting: Meeting) => void
  isStudent?: boolean
}

type MeetingWithNextSchedule = {
  meeting: Meeting
  nextSchedule: MeetingSchedule | null
  recurrence: 'weekly' | 'one-time'
  status: 'upcoming' | 'ongoing' | 'present' | 'cancelled'
}

export function ListView({
  meetings,
  isLoading,
  onViewDetails,
  isStudent = false,
}: ListViewProps) {
  const getTutorLabel = (meeting: Meeting) =>
    meeting.tutor_name ?? `Tutor Assignment #${meeting.tutor_assignment_id}`

  const getStudentLabel = (meeting: Meeting) =>
    meeting.student_name ?? `Student Assignment #${meeting.tutor_assignment_id}`

  const meetingsWithSchedule = useMemo<MeetingWithNextSchedule[]>(() => {
    const now = new Date()
    const nowStr = now.toISOString().split('T')[0]
    const nowTime = now.toTimeString().substring(0, 8)

    return meetings.map(meeting => {
      const activeSchedules = meeting.meeting_schedules.filter(
        s => !s.cancel_at
      )

      const upcomingSchedules = activeSchedules.filter(s => {
        if (s.date > nowStr) return true
        if (s.date === nowStr && s.start_time > nowTime) return true
        return false
      })

      const nextSchedule =
        upcomingSchedules.length > 0
          ? upcomingSchedules.sort((a, b) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date)
              return a.start_time.localeCompare(b.start_time)
            })[0]
          : activeSchedules.length > 0
            ? activeSchedules[activeSchedules.length - 1]
            : null

      const recurrence =
        meeting.meeting_schedules.length > 1 ? 'weekly' : 'one-time'

      let status: MeetingWithNextSchedule['status'] = 'upcoming'
      if (nextSchedule) {
        if (nextSchedule.date === nowStr) {
          if (
            nowTime >= nextSchedule.start_time &&
            nowTime <= nextSchedule.end_time
          ) {
            status = 'ongoing'
          } else if (nowTime > nextSchedule.end_time) {
            status = 'present'
          }
        } else if (nextSchedule.date < nowStr) {
          status = 'present'
        }
      } else {
        status = 'cancelled'
      }

      return {
        meeting,
        nextSchedule,
        recurrence,
        status,
      }
    })
  }, [meetings])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (meetingsWithSchedule.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">No meetings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isStudent
              ? 'When your tutor or staff schedules a session, it will appear here.'
              : 'Create your first meeting to get started'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto py-6">
      <div className="space-y-4">
        {meetingsWithSchedule.map(
          ({ meeting, nextSchedule, recurrence, status }) => (
            <div
              key={meeting.id}
              role="button"
              tabIndex={0}
              onClick={() => onViewDetails(meeting)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onViewDetails(meeting)
                }
              }}
              className="w-full cursor-pointer rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                      meeting.type === 'VIRTUAL'
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-green-500/10 text-green-600'
                    }`}
                  >
                    {meeting.type === 'VIRTUAL' ? (
                      <Video className="h-6 w-6" />
                    ) : (
                      <MapPin className="h-6 w-6" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {meeting.title}
                        </h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Tutor: {getTutorLabel(meeting)} • Student:{' '}
                          {getStudentLabel(meeting)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        {recurrence === 'weekly' && (
                          <span className="flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                            <Calendar className="mr-1 inline h-3 w-3" />
                            Weekly
                          </span>
                        )}
                        <span
                          className={`flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            status === 'ongoing'
                              ? 'bg-green-500/10 text-green-600'
                              : status === 'upcoming'
                                ? 'bg-blue-500/10 text-blue-600'
                                : status === 'present'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-gray-500/10 text-gray-600'
                          }`}
                        >
                          <Clock className="mr-1 inline h-3 w-3" />
                          {status === 'ongoing'
                            ? 'Ongoing'
                            : status === 'upcoming'
                              ? 'Upcoming'
                              : status === 'present'
                                ? 'Present'
                                : 'Cancelled'}
                        </span>
                      </div>
                    </div>

                    {nextSchedule && (
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(nextSchedule.date).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {nextSchedule.start_time.substring(0, 5)} -{' '}
                            {nextSchedule.end_time.substring(0, 5)}
                          </span>
                        </div>
                        {meeting.type === 'VIRTUAL' && meeting.platform && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Video className="h-4 w-4" />
                            <span>{meeting.platform}</span>
                          </div>
                        )}
                        {meeting.type === 'PHYSICAL' && meeting.location && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{meeting.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {meeting.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {meeting.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 text-xs text-muted-foreground">
                      <span className="shrink-0 whitespace-nowrap">
                        Created at
                      </span>
                      <span className="min-w-0 break-words">
                        {new Date(meeting.created_at).toLocaleString('en-US', {
                          month: '2-digit',
                          day: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    onViewDetails(meeting)
                  }}
                  className="w-full shrink-0 rounded-lg bg-primary/10 px-4 py-2 text-center text-sm font-medium text-primary hover:bg-primary/20 sm:w-auto sm:self-start"
                >
                  Click to view Details
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
