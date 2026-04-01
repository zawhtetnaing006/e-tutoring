import { useMemo } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { Meeting, MeetingSchedule } from '@/features/meetings/api'
import type { ViewMode } from '../MeetingManagerPage'

type CalendarViewProps = {
  viewMode: ViewMode
  currentDate: Date
  meetings: Meeting[]
  isLoading: boolean
  onViewDetails: (meeting: Meeting) => void
}

type CalendarEvent = {
  meeting: Meeting
  schedule: MeetingSchedule
  date: string
}

export function CalendarView({
  viewMode,
  currentDate,
  meetings,
  isLoading,
  onViewDetails,
}: CalendarViewProps) {
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = []
    meetings.forEach(meeting => {
      meeting.meeting_schedules.forEach(schedule => {
        if (!schedule.cancel_at) {
          events.push({
            meeting,
            schedule,
            date: schedule.date,
          })
        }
      })
    })
    return events
  }, [meetings])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (viewMode === 'month') {
    return (
      <MonthView
        currentDate={currentDate}
        events={calendarEvents}
        onViewDetails={onViewDetails}
      />
    )
  }

  if (viewMode === 'week') {
    return (
      <WeekView
        currentDate={currentDate}
        events={calendarEvents}
        onViewDetails={onViewDetails}
      />
    )
  }

  if (viewMode === 'day') {
    return (
      <DayView
        currentDate={currentDate}
        events={calendarEvents}
        onViewDetails={onViewDetails}
      />
    )
  }

  return null
}

type MonthViewProps = {
  currentDate: Date
  events: CalendarEvent[]
  onViewDetails: (meeting: Meeting) => void
}

function MonthView({ currentDate, events, onViewDetails }: MonthViewProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const days = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    const prevMonthDate = new Date(year, month, -startingDayOfWeek + i + 1)
    prevMonthDate.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
    days.push({
      date: prevMonthDate,
      isCurrentMonth: false,
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    date.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
    days.push({
      date,
      isCurrentMonth: true,
    })
  }

  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const nextMonthDate = new Date(year, month + 1, i)
    nextMonthDate.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues
    days.push({
      date: nextMonthDate,
      isCurrentMonth: false,
    })
  }

  const today = new Date()
  today.setHours(12, 0, 0, 0)

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach(event => {
      const dateKey = event.date
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(event)
    })
    return map
  }, [events])

  return (
    <div className="h-full py-3">
      <div className="grid h-full grid-cols-7 grid-rows-[auto_repeat(6,1fr)] gap-0 divide-x divide-y divide-border overflow-hidden rounded-lg border border-border">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="bg-muted px-3 py-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          const dateStr = day.date.toISOString().split('T')[0]
          const dayEvents = eventsByDate.get(dateStr) || []
          const isToday = day.date.getTime() === today.getTime()

          return (
            <div
              key={index}
              className={`bg-card p-2 ${
                !day.isCurrentMonth ? 'bg-muted/30' : ''
              }`}
            >
              <div className="mb-1 flex justify-between">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                    isToday
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : day.isCurrentMonth
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  }`}
                >
                  {day.date.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event, idx) => (
                  <button
                    key={idx}
                    onClick={() => onViewDetails(event.meeting)}
                    className="w-full truncate rounded bg-primary/10 px-2 py-1 text-left text-xs text-primary hover:bg-primary/20"
                  >
                    {event.schedule.start_time.substring(0, 5)}{' '}
                    {event.meeting.title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <div className="px-2 text-xs text-muted-foreground">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type WeekViewProps = {
  currentDate: Date
  events: CalendarEvent[]
  onViewDetails: (meeting: Meeting) => void
}

function WeekView({ currentDate, events, onViewDetails }: WeekViewProps) {
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setHours(12, 0, 0, 0)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + i)
      date.setHours(12, 0, 0, 0)
      days.push(date)
    }
    return days
  }, [currentDate])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach(event => {
      const dateKey = event.date
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(event)
    })
    return map
  }, [events])

  const today = new Date()
  today.setHours(12, 0, 0, 0)

  return (
    <div className="h-full py-3">
      <div className="grid h-full grid-cols-7 gap-2">
        {weekDays.map((date, index) => {
          const dateStr = date.toISOString().split('T')[0]
          const dayEvents = eventsByDate.get(dateStr) || []
          const isToday = date.getTime() === today.getTime()

          return (
            <div
              key={index}
              className="flex flex-col overflow-hidden rounded-lg border border-border bg-card"
            >
              <div
                className={`border-b border-border px-3 py-2 text-center ${
                  isToday ? 'bg-primary/10' : 'bg-muted'
                }`}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div
                  className={`mt-1 text-lg font-semibold ${
                    isToday ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto p-2">
                {dayEvents.map((event, idx) => (
                  <button
                    key={idx}
                    onClick={() => onViewDetails(event.meeting)}
                    className="w-full rounded bg-primary/10 px-2 py-1.5 text-left text-xs text-primary hover:bg-primary/20"
                  >
                    <div className="font-medium">
                      {event.schedule.start_time.substring(0, 5)}
                    </div>
                    <div className="truncate">{event.meeting.title}</div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type DayViewProps = {
  currentDate: Date
  events: CalendarEvent[]
  onViewDetails: (meeting: Meeting) => void
}

function DayView({ currentDate, events, onViewDetails }: DayViewProps) {
  const date = new Date(currentDate)
  date.setHours(12, 0, 0, 0)
  const dateStr = date.toISOString().split('T')[0]
  const dayEvents = useMemo(() => {
    return events
      .filter(event => event.date === dateStr)
      .sort((a, b) =>
        a.schedule.start_time.localeCompare(b.schedule.start_time)
      )
  }, [events, dateStr])

  return (
    <div className="h-full py-3">
      <div className="mx-auto">
        <div className="mb-4 rounded-lg border border-border bg-card p-4">
          <h3 className="text-lg font-semibold text-foreground">
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
        </div>

        <div className="space-y-2">
          {dayEvents.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
              No meetings scheduled for this day
            </div>
          ) : (
            dayEvents.map((event, idx) => (
              <button
                key={idx}
                onClick={() => onViewDetails(event.meeting)}
                className="w-full rounded-lg border border-border bg-card p-4 text-left hover:bg-muted/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">
                      {event.meeting.title}
                    </div>
                    {event.meeting.description && (
                      <div className="mt-1 text-sm text-muted-foreground">
                        {event.meeting.description}
                      </div>
                    )}
                    <div className="mt-2 text-sm text-primary">
                      {event.schedule.start_time.substring(0, 5)} -{' '}
                      {event.schedule.end_time.substring(0, 5)}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
