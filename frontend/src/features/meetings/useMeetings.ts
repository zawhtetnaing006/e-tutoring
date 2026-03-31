import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query'
import {
  getMeetings,
  getMeeting,
  getMeetingDetails,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  updateMeetingSchedule,
  type MeetingsResponse,
  type Meeting,
  type MeetingDetails,
  type MeetingSchedule,
  type GetMeetingsParams,
  type CreateMeetingPayload,
  type UpdateMeetingPayload,
  type UpdateMeetingSchedulePayload,
} from './api'

export function useMeetings(
  params: GetMeetingsParams = {}
): UseQueryResult<MeetingsResponse, Error> {
  return useQuery({
    queryKey: ['meetings', params],
    queryFn: () => getMeetings(params),
  })
}

export function useMeeting(meetingId: number): UseQueryResult<Meeting, Error> {
  return useQuery({
    queryKey: ['meetings', meetingId],
    queryFn: () => getMeeting(meetingId),
    enabled: !!meetingId,
  })
}

export function useMeetingDetails(
  meetingId: number
): UseQueryResult<MeetingDetails, Error> {
  return useQuery({
    queryKey: ['meeting-details', meetingId],
    queryFn: () => getMeetingDetails(meetingId),
    enabled: !!meetingId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  })
}

export function useCreateMeeting(): UseMutationResult<
  Meeting,
  Error,
  CreateMeetingPayload
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMeeting,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}

export function useUpdateMeeting(): UseMutationResult<
  Meeting,
  Error,
  { id: number; payload: UpdateMeetingPayload }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => updateMeeting(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}

export function useDeleteMeeting(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}

export function useUpdateMeetingSchedule(): UseMutationResult<
  MeetingSchedule,
  Error,
  { scheduleId: number; payload: UpdateMeetingSchedulePayload }
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ scheduleId, payload }) =>
      updateMeetingSchedule(scheduleId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['meetings'] })
    },
  })
}
