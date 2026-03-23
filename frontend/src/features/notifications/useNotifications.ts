import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './api'
import type { NotificationsListResponse } from './types'

export function useNotifications(page: number = 1, perPage: number = 10) {
  const { data: user } = useCurrentUser()
  const userId = user?.id

  return useQuery<NotificationsListResponse>({
    queryKey: ['notifications', 'list', userId, page, perPage],
    queryFn: () => getNotifications({ page, per_page: perPage }),
    enabled: userId != null,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: data => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      })
      toast.success(data.message)
    },
    onError: () => {
      toast.error('Failed to mark all notifications as read')
    },
  })
}
