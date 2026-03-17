import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { getRealtimeEcho } from '@/features/chat/realtime'
import { paths } from '@/routes'

type RealtimeNotification = {
  id: string
  type: string
  title?: string
  body?: string
  conversation_id?: number
}

function resolveToastTitle(notification: RealtimeNotification) {
  return notification.title?.trim() || 'New Notification'
}

function resolveToastBody(notification: RealtimeNotification) {
  return notification.body?.trim() || 'You have a new notification.'
}

export function useNotificationsRealtime() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: currentUser } = useCurrentUser()

  useEffect(() => {
    const userId = currentUser?.id
    if (userId == null) {
      return
    }

    const echo = getRealtimeEcho()
    if (!echo) {
      return
    }

    const channelName = `App.Models.User.${userId}`

    echo.private(channelName).notification((notification: RealtimeNotification) => {
      void queryClient.invalidateQueries({
        queryKey: ['notifications'],
      })
      void queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      })
      void queryClient.invalidateQueries({
        queryKey: ['chat', 'conversations'],
      })

      toast(resolveToastTitle(notification), {
        description: resolveToastBody(notification),
        action: {
          label: 'Open',
          onClick: () => {
            if (notification.conversation_id != null) {
              navigate({
                pathname: paths.communicationHub,
                search: `?conversation=${notification.conversation_id}`,
              })
              return
            }

            navigate(paths.notifications)
          },
        },
      })
    })

    return () => {
      echo.leave(channelName)
    }
  }, [currentUser?.id, navigate, queryClient])
}
