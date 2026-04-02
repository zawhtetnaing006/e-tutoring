import { useState, useMemo } from 'react'
import { X, Video, MapPin, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'
import {
  useUpdateMeeting,
  useUpdateMeetingSchedule,
} from '@/features/meetings/useMeetings'
import {
  type Meeting,
  type UpdateMeetingPayload,
} from '@/features/meetings/api'
import { getPresetVirtualPlatformLink } from '@/features/meetings/virtual-platform-links'
import { getUserRole } from '@/features/auth/role-utils'
import { getAuthSession } from '@/features/auth/storage'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { useAllocations } from '@/features/allocations/useAllocations'
import { useUsers } from '@/features/users/useUsers'
import { isEndBeforeOrEqualStart, isLocalScheduleStartInPast } from '@/utils'

type EditMeetingModalProps = {
  meeting: Meeting
  scheduleId?: number | null
  onClose: () => void
  onSuccess: () => void
}

const PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'Other']

function firstActiveSchedule(meeting: Meeting) {
  return (
    meeting.meeting_schedules.find(s => !s.cancel_at) ??
    meeting.meeting_schedules[0] ??
    null
  )
}

function resolveEditableSchedule(meeting: Meeting, scheduleId?: number | null) {
  return (
    (scheduleId != null
      ? meeting.meeting_schedules.find(schedule => schedule.id === scheduleId)
      : undefined) ?? firstActiveSchedule(meeting)
  )
}

export function EditMeetingModal({
  meeting,
  scheduleId,
  onClose,
  onSuccess,
}: EditMeetingModalProps) {
  const [title, setTitle] = useState(meeting.title)
  const [description, setDescription] = useState(meeting.description || '')
  const [type, setType] = useState<'VIRTUAL' | 'PHYSICAL'>(meeting.type)
  const [platform, setPlatform] = useState(meeting.platform || '')
  const [link, setLink] = useState(
    () => meeting.link ?? getPresetVirtualPlatformLink(meeting.platform) ?? ''
  )
  const [location, setLocation] = useState(meeting.location || '')
  const [tutorAssignmentId, setTutorAssignmentId] = useState(
    meeting.tutor_assignment_id
  )

  const initialSchedule = resolveEditableSchedule(meeting, scheduleId)
  const [scheduleDate, setScheduleDate] = useState(initialSchedule?.date ?? '')
  const [scheduleStart, setScheduleStart] = useState(
    initialSchedule ? initialSchedule.start_time.substring(0, 5) : ''
  )
  const [scheduleEnd, setScheduleEnd] = useState(
    initialSchedule ? initialSchedule.end_time.substring(0, 5) : ''
  )

  const currentUserQuery = useCurrentUser()
  const effectiveUser = currentUserQuery.data ?? getAuthSession()?.user ?? null
  const isTutor = getUserRole(effectiveUser) === 'tutor'

  const allocationsQuery = useAllocations({
    perPage: 100,
    onlyMine: isTutor,
  })

  const tutorAssignmentOptions = useMemo(() => {
    const rows = allocationsQuery.data?.data ?? []
    if (!isTutor || effectiveUser?.id == null) return rows
    return rows.filter(a => a.tutor_user_id === effectiveUser.id)
  }, [allocationsQuery.data?.data, isTutor, effectiveUser])

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

  const updateMutation = useUpdateMeeting()
  const updateScheduleMutation = useUpdateMeetingSchedule()

  const recurrenceType =
    (meeting.schedule_count ?? meeting.meeting_schedules.length) > 1
      ? 'weekly'
      : 'one-time'
  const editableSchedule = resolveEditableSchedule(meeting, scheduleId)

  const handleMutationSuccess = () => {
    toast.success('Meeting updated', {
      description: 'The meeting has been updated successfully.',
    })
    onSuccess()
  }

  const handleMutationError = (error: Error) => {
    const description =
      error instanceof Error ? error.message : 'Please try again later.'
    toast.error('Failed to update meeting', { description })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!tutorAssignmentId) {
      toast.error('Please select a tutor and student')
      return
    }

    if (!editableSchedule) {
      toast.error('No active schedule to update')
      return
    }

    if (!scheduleDate || !scheduleStart || !scheduleEnd) {
      toast.error('Please fill in date and time for the schedule')
      return
    }

    if (isEndBeforeOrEqualStart(scheduleDate, scheduleStart, scheduleEnd)) {
      toast.error('End time must be after start time')
      return
    }

    const scheduleChanged =
      scheduleDate !== editableSchedule.date ||
      scheduleStart !== editableSchedule.start_time.substring(0, 5) ||
      scheduleEnd !== editableSchedule.end_time.substring(0, 5)

    if (
      scheduleChanged &&
      isLocalScheduleStartInPast(scheduleDate, scheduleStart)
    ) {
      toast.error(
        'Schedule must be in the present or future (your local time).'
      )
      return
    }

    const payload: UpdateMeetingPayload = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      platform: type === 'VIRTUAL' ? platform.trim() || null : null,
      link: type === 'VIRTUAL' ? link.trim() || null : null,
      location: type === 'PHYSICAL' ? location.trim() || null : null,
      tutor_assignment_id: tutorAssignmentId,
    }

    try {
      await updateMutation.mutateAsync({ id: meeting.id, payload })

      if (scheduleChanged) {
        await updateScheduleMutation.mutateAsync({
          scheduleId: editableSchedule.id,
          payload: {
            date: scheduleDate,
            start_time: scheduleStart,
            end_time: scheduleEnd,
          },
        })
      }

      handleMutationSuccess()
    } catch (err) {
      handleMutationError(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-auto w-full max-w-2xl rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Edit Meeting
            </h2>
            <p className="text-sm text-muted-foreground">
              Update schedule and meeting details with tutor and student
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
                htmlFor="edit-meeting-title"
                className="block text-sm font-medium text-foreground"
              >
                Meeting Title <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-meeting-title"
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
                htmlFor="edit-meeting-description"
                className="block text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="edit-meeting-description"
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
                  htmlFor="edit-tutor-select"
                  className="block text-sm font-medium text-foreground"
                >
                  Select Tutor <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-tutor-select"
                  value={tutorAssignmentId || ''}
                  onChange={e =>
                    setTutorAssignmentId(Number(e.target.value) || 0)
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select Tutor</option>
                  {tutorAssignmentOptions.map(allocation => {
                    const tutor = tutorsQuery.data?.data.find(
                      u => u.id === allocation.tutor_user_id
                    )
                    const label =
                      isTutor &&
                      effectiveUser?.id === allocation.tutor_user_id &&
                      effectiveUser.name
                        ? effectiveUser.name
                        : tutor?.name || `Tutor #${allocation.tutor_user_id}`
                    return (
                      <option key={allocation.id} value={allocation.id}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label
                  htmlFor="edit-student-select"
                  className="block text-sm font-medium text-foreground"
                >
                  Select Student <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-student-select"
                  value={tutorAssignmentId || ''}
                  onChange={e =>
                    setTutorAssignmentId(Number(e.target.value) || 0)
                  }
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={!tutorAssignmentId}
                >
                  <option value="">Select Student</option>
                  {selectedAllocation && (
                    <option value={tutorAssignmentId}>{studentName}</option>
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
                  onClick={() => setType('VIRTUAL')}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    type === 'VIRTUAL'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                  aria-pressed={type === 'VIRTUAL'}
                >
                  <Video
                    className={`h-6 w-6 ${type === 'VIRTUAL' ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-sm font-medium ${type === 'VIRTUAL' ? 'text-primary' : 'text-foreground'}`}
                  >
                    Virtual Meeting
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('PHYSICAL')}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    type === 'PHYSICAL'
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                  aria-pressed={type === 'PHYSICAL'}
                >
                  <MapPin
                    className={`h-6 w-6 ${type === 'PHYSICAL' ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-sm font-medium ${type === 'PHYSICAL' ? 'text-primary' : 'text-foreground'}`}
                  >
                    Physical Meeting
                  </span>
                </button>
              </div>
            </div>

            {type === 'VIRTUAL' && (
              <>
                <div>
                  <label
                    htmlFor="edit-platform-select"
                    className="block text-sm font-medium text-foreground"
                  >
                    Online Platform <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="edit-platform-select"
                    value={platform}
                    onChange={e => {
                      const next = e.target.value
                      setPlatform(next)
                      const preset = getPresetVirtualPlatformLink(next)
                      setLink(preset ?? '')
                    }}
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
                    htmlFor="edit-meeting-link"
                    className="block text-sm font-medium text-foreground"
                  >
                    Meeting Invitation Link{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-meeting-link"
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

            {type === 'PHYSICAL' && (
              <div>
                <label
                  htmlFor="edit-meeting-location"
                  className="block text-sm font-medium text-foreground"
                >
                  Physical Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-meeting-location"
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
                    name="recurrence-type"
                    checked={recurrenceType === 'one-time'}
                    readOnly
                    className="h-4 w-4 text-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    One-time
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="recurrence-type"
                    checked={recurrenceType === 'weekly'}
                    readOnly
                    className="h-4 w-4 text-primary"
                  />
                  <span className="text-sm text-muted-foreground">Weekly</span>
                </label>
              </div>
              {recurrenceType === 'weekly' && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Date and time below apply to the next active occurrence. Other
                  weekly instances are updated separately if needed.
                </p>
              )}
            </div>

            {editableSchedule && (
              <>
                <div>
                  <label
                    htmlFor="edit-schedule-date"
                    className="block text-sm font-medium text-foreground"
                  >
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="edit-schedule-date"
                      type="date"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="edit-schedule-start-time"
                      className="block text-sm font-medium text-foreground"
                    >
                      Start Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="edit-schedule-start-time"
                        type="time"
                        value={scheduleStart}
                        onChange={e => setScheduleStart(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="edit-schedule-end-time"
                      className="block text-sm font-medium text-foreground"
                    >
                      End Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="edit-schedule-end-time"
                        type="time"
                        value={scheduleEnd}
                        onChange={e => setScheduleEnd(e.target.value)}
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
              disabled={
                updateMutation.isPending || updateScheduleMutation.isPending
              }
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateMutation.isPending || updateScheduleMutation.isPending
                ? 'Saving...'
                : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
