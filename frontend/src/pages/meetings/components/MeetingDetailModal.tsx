import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X,
  Calendar,
  RefreshCw,
  CheckCircle,
  XCircle,
  MinusCircle,
  Link as LinkIcon,
  LoaderCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'
import {
  createMeetingAttendance,
  type Meeting,
  type MeetingAttendance,
  type MeetingSchedule,
} from '@/features/meetings/api'
import { resolveVirtualJoinUrl } from '@/features/meetings/virtual-platform-links'
import {
  useDeleteMeeting,
  useMeetingDetails,
  useUpdateMeetingSchedule,
} from '@/features/meetings/useMeetings'

type MeetingDetailModalProps = {
  meeting: Meeting
  /** Staff and tutors can reschedule and record attendance; students are read-only. */
  canManageMeeting: boolean
  onClose: () => void
  onEdit: () => void
}

type AttendanceStatus = 'PRESENCE' | 'ABSENCE' | 'ON_LEAVE'

type MeetingDetailModalDraftProps = {
  meeting: Meeting
  meetingId: number
  canManageMeeting: boolean
  onClose: () => void
  onEdit: () => void
  primarySchedule: MeetingSchedule | null
  existingAttendance: MeetingAttendance | null
  attendanceLocked: boolean
  detailLoading: boolean
  detailError: boolean
}

export function MeetingDetailModal({
  meeting,
  canManageMeeting,
  onClose,
  onEdit,
}: MeetingDetailModalProps) {
  const detailQuery = useMeetingDetails(meeting.id)
  const detailMeeting = detailQuery.data ?? meeting

  const primarySchedule = useMemo(() => {
    return (
      detailMeeting.meeting_schedules.find(schedule => !schedule.cancel_at) ??
      detailMeeting.meeting_schedules[0] ??
      null
    )
  }, [detailMeeting.meeting_schedules])

  const existingAttendance = detailQuery.data?.student_attendance ?? null
  const attendanceLocked = detailQuery.data?.attendance_locked ?? false
  const draftKey = [
    meeting.id,
    primarySchedule?.updated_at ?? 'no-schedule',
    existingAttendance?.updated_at ?? 'no-attendance',
    detailQuery.data ? 'loaded' : detailQuery.isError ? 'error' : 'fallback',
  ].join(':')

  return (
    <MeetingDetailModalDraft
      key={draftKey}
      meeting={detailMeeting}
      meetingId={meeting.id}
      canManageMeeting={canManageMeeting}
      onClose={onClose}
      onEdit={onEdit}
      primarySchedule={primarySchedule}
      existingAttendance={existingAttendance}
      attendanceLocked={attendanceLocked}
      detailLoading={detailQuery.isLoading}
      detailError={detailQuery.isError}
    />
  )
}

function MeetingDetailModalDraft({
  meeting,
  meetingId,
  canManageMeeting,
  onClose,
  onEdit,
  primarySchedule,
  existingAttendance,
  attendanceLocked,
  detailLoading,
  detailError,
}: MeetingDetailModalDraftProps) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState(() => primarySchedule?.note ?? '')
  const [selectedAttendance, setSelectedAttendance] =
    useState<AttendanceStatus | null>(() => existingAttendance?.status ?? null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const tutorName = meeting.tutor_name ?? getTutorFallback(meeting)
  const studentName = meeting.student_name ?? getStudentFallback(meeting)
  const studentId = meeting.student_user_id
  const recurrenceType =
    meeting.meeting_schedules.length > 1 ? 'weekly' : 'one-time'
  const firstSchedule = meeting.meeting_schedules[0]
  const isVirtual = meeting.type === 'VIRTUAL'
  const virtualJoinUrl = isVirtual ? resolveVirtualJoinUrl(meeting) : null

  const updateScheduleMutation = useUpdateMeetingSchedule()
  const deleteMeetingMutation = useDeleteMeeting()
  const attendanceMutation = useMutation({
    mutationFn: createMeetingAttendance,
    onSuccess: () => {
      toast.success('Attendance saved', {
        description: 'Student attendance has been recorded.',
      })
      void queryClient.invalidateQueries({ queryKey: ['meetings'] })
      void queryClient.invalidateQueries({
        queryKey: ['meeting-details', meetingId],
      })
    },
    onError: error => {
      const description =
        error instanceof Error ? error.message : 'Please try again later.'
      toast.error('Failed to save attendance', { description })
    },
  })

  const isSaving =
    attendanceMutation.isPending || updateScheduleMutation.isPending
  const normalizedNote = normalizeNullableText(notes)
  const savedNote = normalizeNullableText(primarySchedule?.note ?? null)
  const hasNoteChanged =
    primarySchedule !== null && normalizedNote !== savedNote
  const hasAttendanceSelection =
    !attendanceLocked && selectedAttendance !== null
  const canSave =
    !detailLoading &&
    !detailError &&
    !isSaving &&
    (hasNoteChanged || hasAttendanceSelection)

  const confirmDeleteMeeting = () => {
    deleteMeetingMutation.mutate(meetingId, {
      onSuccess: () => {
        toast.success('Meeting deleted successfully', {
          description:
            'The meeting and its scheduled sessions have been removed from the system.',
        })
        void queryClient.invalidateQueries({ queryKey: ['meetings'] })
        void queryClient.invalidateQueries({
          queryKey: ['meeting-details', meetingId],
        })
        setDeleteConfirmOpen(false)
        onClose()
      },
      onError: error => {
        const description =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Please try again later.'
        toast.error('Failed to delete meeting', {
          description,
        })
      },
    })
  }

  const handleSave = async () => {
    if (!hasNoteChanged && attendanceLocked) {
      return
    }

    if (!attendanceLocked && !selectedAttendance) {
      toast.error('Please select attendance status')
      return
    }

    if (!attendanceLocked && !studentId) {
      toast.error('Student not found')
      return
    }

    try {
      if (primarySchedule && hasNoteChanged) {
        await updateScheduleMutation.mutateAsync({
          scheduleId: primarySchedule.id,
          payload: { note: normalizedNote },
        })
      }

      if (!attendanceLocked && selectedAttendance && studentId) {
        await attendanceMutation.mutateAsync({
          meeting_id: meetingId,
          user_id: studentId,
          status: selectedAttendance,
        })
      }

      queryClient.removeQueries({
        queryKey: ['meeting-details', meetingId],
        exact: true,
      })
      queryClient.removeQueries({
        queryKey: ['meetings', meetingId],
        exact: true,
      })
      await queryClient.invalidateQueries({
        queryKey: ['meetings'],
        refetchType: 'active',
      })

      onClose()
    } catch {
      // toasts handled by mutations
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      {deleteConfirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-meeting-dialog-title"
        >
          <div className="my-auto w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3
              id="delete-meeting-dialog-title"
              className="text-lg font-semibold text-foreground"
            >
              Delete this meeting?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently remove &quot;{meeting.title}&quot; and all
              of its scheduled sessions. This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleteMeetingMutation.isPending}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Keep meeting
              </button>
              <button
                type="button"
                onClick={confirmDeleteMeeting}
                disabled={deleteMeetingMutation.isPending}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteMeetingMutation.isPending
                  ? 'Deleting…'
                  : 'Delete meeting'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="my-auto w-full max-w-2xl rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              {meeting.title}
            </h2>
            {recurrenceType === 'weekly' && (
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                <Calendar className="mr-1 inline h-3 w-3" />
                Weekly
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-6">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="mb-3 font-medium text-foreground">
              Meeting Information
            </h3>
            <div
              className={`grid gap-4 text-sm ${isVirtual ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}
            >
              <div>
                <div className="text-muted-foreground">Tutor</div>
                <div className="mt-1 font-medium text-foreground">
                  {tutorName}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Student</div>
                <div className="mt-1 font-medium text-foreground">
                  {studentName}
                </div>
              </div>
              {isVirtual && (
                <div>
                  <div className="text-muted-foreground">Meet</div>
                  <div className="mt-1">
                    {virtualJoinUrl ? (
                      <a
                        href={virtualJoinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-blue-500 hover:underline"
                      >
                        <LinkIcon className="h-3 w-3" />
                        Join Meeting
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isVirtual && meeting.location && (
              <div className="mt-4 border-t border-border pt-4 text-sm">
                <div className="text-muted-foreground">Location</div>
                <div className="mt-1 font-medium text-foreground">
                  {meeting.location}
                </div>
              </div>
            )}

            {firstSchedule && (
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Date & Time</div>
                  <div className="mt-1 font-medium text-foreground">
                    {firstSchedule.date}{' '}
                    {firstSchedule.start_time.substring(0, 5)}-
                    {firstSchedule.end_time.substring(0, 5)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Asia/Yangon Time</div>
                  <div className="mt-1 font-medium text-foreground">
                    {getTimezone()}
                  </div>
                </div>
              </div>
            )}

            {meeting.description && (
              <div className="mt-4 border-t border-border pt-4 text-sm">
                <div className="text-muted-foreground">Description</div>
                <div className="mt-1 text-foreground">
                  {meeting.description}
                </div>
              </div>
            )}

            {primarySchedule?.note && !canManageMeeting && (
              <div className="mt-4 border-t border-border pt-4 text-sm">
                <div className="text-muted-foreground">Meeting notes</div>
                <div className="mt-1 whitespace-pre-wrap text-foreground">
                  {primarySchedule.note}
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-border pt-4 text-sm">
              <div className="text-muted-foreground">Created At</div>
              <div className="mt-1 text-foreground">
                {new Date(meeting.created_at).toLocaleString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {canManageMeeting && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reschedule
                </button>
              )}
              {canManageMeeting && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={deleteMeetingMutation.isPending}
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Cancel Meeting
                </button>
              )}
            </div>
          </div>

          {canManageMeeting && (
            <div className="mt-6">
              <h3 className="mb-3 font-medium text-foreground">
                Student Attendance <span className="text-red-500">*</span>
              </h3>
              {detailLoading && (
                <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading attendance details...
                </div>
              )}
              {detailError && (
                <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  Failed to load the latest meeting details. Attendance changes
                  are disabled until the data is available.
                </div>
              )}
              {existingAttendance && (
                <div className="mb-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  Attendance was already recorded for this meeting. Updating
                  attendance is disabled.
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <AttendanceButton
                  label="Present"
                  value="PRESENCE"
                  selectedAttendance={selectedAttendance}
                  onSelect={setSelectedAttendance}
                  disabled={attendanceLocked || detailLoading || detailError}
                  activeClassName="border-green-500 bg-green-500/10 text-green-600"
                  icon={<CheckCircle className="h-6 w-6" />}
                />
                <AttendanceButton
                  label="Absent"
                  value="ABSENCE"
                  selectedAttendance={selectedAttendance}
                  onSelect={setSelectedAttendance}
                  disabled={attendanceLocked || detailLoading || detailError}
                  activeClassName="border-red-500 bg-red-500/10 text-red-600"
                  icon={<XCircle className="h-6 w-6" />}
                />
                <AttendanceButton
                  label="On Leave"
                  value="ON_LEAVE"
                  selectedAttendance={selectedAttendance}
                  onSelect={setSelectedAttendance}
                  disabled={attendanceLocked || detailLoading || detailError}
                  activeClassName="border-orange-500 bg-orange-500/10 text-orange-600"
                  icon={<MinusCircle className="h-6 w-6" />}
                />
              </div>
            </div>
          )}

          {canManageMeeting && (
            <div className="mt-6">
              <h3 className="mb-3 font-medium text-foreground">
                Meeting Notes
              </h3>
              <textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Record key discussion points, action items, and follow-up tasks..."
                rows={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {canManageMeeting && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!canSave}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSaving
                  ? 'Saving...'
                  : hasNoteChanged && !hasAttendanceSelection
                    ? 'Save Notes'
                    : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type AttendanceButtonProps = {
  label: string
  value: AttendanceStatus
  selectedAttendance: AttendanceStatus | null
  onSelect: (value: AttendanceStatus) => void
  disabled: boolean
  activeClassName: string
  icon: ReactNode
}

function AttendanceButton({
  label,
  value,
  selectedAttendance,
  onSelect,
  disabled,
  activeClassName,
  icon,
}: AttendanceButtonProps) {
  const isSelected = selectedAttendance === value

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
        isSelected
          ? activeClassName
          : 'border-border bg-background hover:bg-muted'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span className={isSelected ? '' : 'text-muted-foreground'}>{icon}</span>
      <span
        className={`text-sm font-medium ${isSelected ? '' : 'text-foreground'}`}
      >
        {label}
      </span>
    </button>
  )
}

function getTimezone() {
  const offset = -new Date().getTimezoneOffset()
  const hours = Math.floor(Math.abs(offset) / 60)
  const minutes = Math.abs(offset) % 60
  const sign = offset >= 0 ? '+' : '-'

  return `UCT ${sign}${hours}:${minutes.toString().padStart(2, '0')}`
}

function normalizeNullableText(value: string | null | undefined) {
  const normalized = typeof value === 'string' ? value.trim() : ''

  return normalized === '' ? null : normalized
}

function getTutorFallback(meeting: Meeting) {
  return `Tutor Assignment #${meeting.tutor_assignment_id}`
}

function getStudentFallback(meeting: Meeting) {
  return `Student Assignment #${meeting.tutor_assignment_id}`
}
