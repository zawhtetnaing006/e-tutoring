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
  createMeeting,
  updateMeeting,
  deleteMeeting,
  type MeetingsResponse,
  type Meeting,
  type GetMeetingsParams,
  type CreateMeetingPayload,
  type UpdateMeetingPayload,
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
