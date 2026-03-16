import { useState, useMemo } from 'react'
import { X, Video, MapPin, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateMeeting } from '@/features/meetings/useMeetings'
import {
  type Meeting,
  type UpdateMeetingPayload,
} from '@/features/meetings/api'
import { useAllocations } from '@/features/allocations/useAllocations'
import { useUsers } from '@/features/users/useUsers'

type EditMeetingModalProps = {
  meeting: Meeting
  onClose: () => void
  onSuccess: () => void
}

const PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Skype', 'Other']

export function EditMeetingModal({
  meeting,
  onClose,
  onSuccess,
}: EditMeetingModalProps) {
  const [title, setTitle] = useState(meeting.title)
  const [description, setDescription] = useState(meeting.description || '')
  const [type, setType] = useState<'VIRTUAL' | 'PHYSICAL'>(meeting.type)
  const [platform, setPlatform] = useState(meeting.platform || '')
  const [link, setLink] = useState(meeting.link || '')
  const [location, setLocation] = useState(meeting.location || '')

  const allocationsQuery = useAllocations({ perPage: 1000 })
  const tutorsQuery = useUsers({ perPage: 100, role_code: 'TUTOR' })
  const studentsQuery = useUsers({ perPage: 100, role_code: 'STUDENT' })

  const selectedAllocation = useMemo(() => {
    return allocationsQuery.data?.data.find(
      a => a.id === meeting.tutor_assignment_id
    )
  }, [meeting.tutor_assignment_id, allocationsQuery.data?.data])

  const tutorName = useMemo(() => {
    if (!selectedAllocation) return ''
    const tutor = tutorsQuery.data?.data.find(
      u => u.id === selectedAllocation.tutor_user_id
    )
    return tutor?.name || `Tutor #${selectedAllocation.tutor_user_id}`
  }, [selectedAllocation, tutorsQuery.data?.data])

  const studentName = useMemo(() => {
    if (!selectedAllocation) return ''
    const student = studentsQuery.data?.data.find(
      u => u.id === selectedAllocation.student_user_id
    )
    return student?.name || `Student #${selectedAllocation.student_user_id}`
  }, [selectedAllocation, studentsQuery.data?.data])

  const updateMutation = useUpdateMeeting()

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    const payload: UpdateMeetingPayload = {
      title: title.trim(),
      description: description.trim() || null,
      type,
      platform: type === 'VIRTUAL' ? platform.trim() || null : null,
      link: type === 'VIRTUAL' ? link.trim() || null : null,
      location: type === 'PHYSICAL' ? location.trim() || null : null,
    }

    updateMutation.mutate(
      { id: meeting.id, payload },
      {
        onSuccess: handleMutationSuccess,
        onError: handleMutationError,
      }
    )
  }

  const recurrenceType =
    meeting.meeting_schedules.length > 1 ? 'weekly' : 'one-time'
  const firstSchedule = meeting.meeting_schedules[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-auto w-full max-w-2xl rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Edit Meeting
            </h2>
            <p className="text-sm text-muted-foreground">
              Eid Schedule a meeting with tutor and student
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
                  value={meeting.tutor_assignment_id}
                  disabled
                  className="mt-1 w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                >
                  <option value={meeting.tutor_assignment_id}>
                    {tutorName}
                  </option>
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
                  value={meeting.tutor_assignment_id}
                  disabled
                  className="mt-1 w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                >
                  <option value={meeting.tutor_assignment_id}>
                    {studentName}
                  </option>
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
                    disabled
                    className="h-4 w-4 cursor-not-allowed text-primary"
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
                    disabled
                    className="h-4 w-4 cursor-not-allowed text-primary"
                  />
                  <span className="text-sm text-muted-foreground">Weekly</span>
                </label>
              </div>
            </div>

            {recurrenceType === 'one-time' && firstSchedule && (
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
                      value={firstSchedule.date}
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2 pl-10 text-sm text-muted-foreground"
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
                        value={firstSchedule.start_time.substring(0, 5)}
                        disabled
                        className="w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2 pl-10 text-sm text-muted-foreground"
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
                        value={firstSchedule.end_time.substring(0, 5)}
                        disabled
                        className="w-full cursor-not-allowed rounded-lg border border-border bg-muted px-3 py-2 pl-10 text-sm text-muted-foreground"
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
              disabled={updateMutation.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
