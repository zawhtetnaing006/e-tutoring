import { useState, useMemo } from 'react'
import { X, Video, MapPin, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateMeeting } from '@/features/meetings/useMeetings'
import { type CreateMeetingPayload } from '@/features/meetings/api'
import { useAllocations } from '@/features/allocations/useAllocations'
import { useUsers } from '@/features/users/useUsers'

type RecurrenceType = 'one-time' | 'weekly'

type CreateMeetingModalProps = {
  onClose: () => void
  onSuccess: () => void
}

const PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'Other']
const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export function CreateMeetingModal({
  onClose,
  onSuccess,
}: CreateMeetingModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'virtual' | 'physical'>('physical')
  const [platform, setPlatform] = useState('')
  const [link, setLink] = useState('')
  const [location, setLocation] = useState('')
  const [tutorAssignmentId, setTutorAssignmentId] = useState<number | null>(
    null
  )
  const [recurrence, setRecurrence] = useState<RecurrenceType>('weekly')

  const [oneTimeDate, setOneTimeDate] = useState('')
  const [oneTimeStartTime, setOneTimeStartTime] = useState('')
  const [oneTimeEndTime, setOneTimeEndTime] = useState('')

  const [weeklyStartDate, setWeeklyStartDate] = useState('')
  const [weeklyEndDate, setWeeklyEndDate] = useState('')
  const [weeklyWeekday, setWeeklyWeekday] = useState<number | null>(null)
  const [weeklyStartTime, setWeeklyStartTime] = useState('')
  const [weeklyEndTime, setWeeklyEndTime] = useState('')

  const allocationsQuery = useAllocations({ perPage: 1000 })
  const tutorsQuery = useUsers({ perPage: 100, role_code: 'TUTOR' })
  const studentsQuery = useUsers({ perPage: 100, role_code: 'STUDENT' })

  const selectedAllocation = useMemo(() => {
    if (!tutorAssignmentId) return null
    return allocationsQuery.data?.data.find(a => a.id === tutorAssignmentId)
  }, [tutorAssignmentId, allocationsQuery.data?.data])

  const studentName = useMemo(() => {
    if (!selectedAllocation) return ''
    const student = studentsQuery.data?.data.find(
      u => u.id === selectedAllocation.student_user_id
    )
    return student?.name || `Student #${selectedAllocation.student_user_id}`
  }, [selectedAllocation, studentsQuery.data?.data])

  const createMutation = useCreateMeeting()

  const handleMutationSuccess = () => {
    toast.success('Meeting created', {
      description: 'The meeting has been scheduled successfully.',
    })
    onSuccess()
  }

  const handleMutationError = (error: Error) => {
    const description =
      error instanceof Error ? error.message : 'Please try again later.'
    toast.error('Failed to create meeting', { description })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!tutorAssignmentId) {
      toast.error('Please select a tutor and student')
      return
    }

    const meetingSchedules: CreateMeetingPayload['meeting_schedules'] = []

    if (recurrence === 'one-time') {
      if (!oneTimeDate || !oneTimeStartTime || !oneTimeEndTime) {
        toast.error('Please fill in all date and time fields')
        return
      }
      meetingSchedules.push({
        date: oneTimeDate,
        start_time: oneTimeStartTime,
        end_time: oneTimeEndTime,
      })
    } else if (recurrence === 'weekly') {
      if (
        !weeklyStartDate ||
        !weeklyEndDate ||
        weeklyWeekday === null ||
        !weeklyStartTime ||
        !weeklyEndTime
      ) {
        toast.error('Please fill in all fields for weekly recurrence')
        return
      }

      const startDate = new Date(weeklyStartDate)
      const endDate = new Date(weeklyEndDate)
      const currentDate = new Date(startDate)

      while (currentDate.getDay() !== weeklyWeekday) {
        currentDate.setDate(currentDate.getDate() + 1)
      }

      while (currentDate <= endDate) {
        meetingSchedules.push({
          date: currentDate.toISOString().split('T')[0],
          start_time: weeklyStartTime,
          end_time: weeklyEndTime,
        })
        currentDate.setDate(currentDate.getDate() + 7)
      }

      if (meetingSchedules.length === 0) {
        toast.error(
          'No meeting dates generated. Check your date range and weekday.'
        )
        return
      }
    }

    const payload: CreateMeetingPayload = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      platform: type === 'virtual' ? platform.trim() || null : null,
      link: type === 'virtual' ? link.trim() || null : null,
      location: type === 'physical' ? location.trim() || null : null,
      tutor_assignment_id: tutorAssignmentId,
      meeting_schedules: meetingSchedules,
    }

    createMutation.mutate(payload, {
      onSuccess: handleMutationSuccess,
      onError: handleMutationError,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-auto w-full max-w-2xl rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Create A Meeting
            </h2>
            <p className="text-sm text-muted-foreground">
              Schedule a meeting with tutor and student
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="meeting-title"
                className="block text-sm font-medium text-foreground"
              >
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                id="meeting-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Weekly Check-in"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label
                htmlFor="meeting-description"
                className="block text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="meeting-description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Meeting and topics to discuss"
                rows={3}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="tutor-select"
                  className="block text-sm font-medium text-foreground"
                >
                  Select Tutor <span className="text-red-500">*</span>
                </label>
                <select
                  id="tutor-select"
                  value={tutorAssignmentId || ''}
                  onChange={e =>
                    setTutorAssignmentId(Number(e.target.value) || null)
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select Tutor</option>
                  {allocationsQuery.data?.data.map(allocation => {
                    const tutor = tutorsQuery.data?.data.find(
                      u => u.id === allocation.tutor_user_id
                    )
                    return (
                      <option key={allocation.id} value={allocation.id}>
                        {tutor?.name || `Tutor #${allocation.tutor_user_id}`}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label
                  htmlFor="student-select"
                  className="block text-sm font-medium text-foreground"
                >
                  Select Student <span className="text-red-500">*</span>
                </label>
                <select
                  id="student-select"
                  value={tutorAssignmentId || ''}
                  onChange={e =>
                    setTutorAssignmentId(Number(e.target.value) || null)
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={!tutorAssignmentId}
                >
                  <option value="">Select Student</option>
                  {selectedAllocation && (
                    <option value={tutorAssignmentId!}>{studentName}</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <div className="mb-2 block text-sm font-medium text-foreground">
                Meeting Type <span className="text-red-500">*</span>
              </div>
              <div
                className="grid grid-cols-2 gap-3"
                role="group"
                aria-label="Meeting Type"
              >
                <button
                  type="button"
                  onClick={() => setType('virtual')}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    type === 'virtual'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                  aria-pressed={type === 'virtual'}
                >
                  <Video
                    className={`h-6 w-6 ${type === 'virtual' ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-sm font-medium ${type === 'virtual' ? 'text-primary' : 'text-foreground'}`}
                  >
                    Virtual Meeting
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('physical')}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    type === 'physical'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                  aria-pressed={type === 'physical'}
                >
                  <MapPin
                    className={`h-6 w-6 ${type === 'physical' ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-sm font-medium ${type === 'physical' ? 'text-primary' : 'text-foreground'}`}
                  >
                    Physical Meeting
                  </span>
                </button>
              </div>
            </div>

            {type === 'virtual' && (
              <>
                <div>
                  <label
                    htmlFor="platform-select"
                    className="block text-sm font-medium text-foreground"
                  >
                    Online Platform <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="platform-select"
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Choose Platform</option>
                    {PLATFORMS.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="meeting-link"
                    className="block text-sm font-medium text-foreground"
                  >
                    Meeting Invitation Link{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="meeting-link"
                    type="url"
                    value={link}
                    onChange={e => setLink(e.target.value)}
                    placeholder="e.g. https://zoom.us/124223234"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </>
            )}

            {type === 'physical' && (
              <div>
                <label
                  htmlFor="meeting-location"
                  className="block text-sm font-medium text-foreground"
                >
                  Physical Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="meeting-location"
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Room 305, Building A"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            )}

            <div>
              <div className="mb-2 block text-sm font-medium text-foreground">
                Recurrence
              </div>
              <div className="flex gap-4" role="group" aria-label="Recurrence">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="recurrence"
                    checked={recurrence === 'one-time'}
                    onChange={() => setRecurrence('one-time')}
                    className="h-4 w-4 text-primary"
                  />
                  <span className="text-sm text-foreground">One-time</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="recurrence"
                    checked={recurrence === 'weekly'}
                    onChange={() => setRecurrence('weekly')}
                    className="h-4 w-4 text-primary"
                  />
                  <span className="text-sm text-foreground">Weekly</span>
                </label>
              </div>
            </div>

            {recurrence === 'one-time' && (
              <>
                <div>
                  <label
                    htmlFor="one-time-date"
                    className="block text-sm font-medium text-foreground"
                  >
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="one-time-date"
                      type="date"
                      value={oneTimeDate}
                      onChange={e => setOneTimeDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="one-time-start"
                      className="block text-sm font-medium text-foreground"
                    >
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="one-time-start"
                        type="time"
                        value={oneTimeStartTime}
                        onChange={e => setOneTimeStartTime(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="one-time-end"
                      className="block text-sm font-medium text-foreground"
                    >
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="one-time-end"
                        type="time"
                        value={oneTimeEndTime}
                        onChange={e => setOneTimeEndTime(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {recurrence === 'weekly' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="weekly-start-date"
                      className="block text-sm font-medium text-foreground"
                    >
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="weekly-start-date"
                        type="date"
                        value={weeklyStartDate}
                        onChange={e => setWeeklyStartDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="weekly-end-date"
                      className="block text-sm font-medium text-foreground"
                    >
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="weekly-end-date"
                        type="date"
                        value={weeklyEndDate}
                        onChange={e => setWeeklyEndDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="weekly-weekday"
                    className="block text-sm font-medium text-foreground"
                  >
                    Weekday <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="weekly-weekday"
                    value={weeklyWeekday ?? ''}
                    onChange={e => setWeeklyWeekday(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a Weekday</option>
                    {WEEKDAYS.map((day, index) => (
                      <option key={day} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="weekly-start-time"
                      className="block text-sm font-medium text-foreground"
                    >
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="weekly-start-time"
                        type="time"
                        value={weeklyStartTime}
                        onChange={e => setWeeklyStartTime(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="weekly-end-time"
                      className="block text-sm font-medium text-foreground"
                    >
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="weekly-end-time"
                        type="time"
                        value={weeklyEndTime}
                        onChange={e => setWeeklyEndTime(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
