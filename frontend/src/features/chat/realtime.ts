import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { getBaseUrl } from '@/lib/api-client'
import { getAuthSession } from '@/features/auth/storage'

let echoInstance: Echo<'reverb'> | null = null
let echoToken: string | null = null

function getBroadcastAuthEndpoint() {
  const baseUrl = getBaseUrl()

  if (!baseUrl) {
    return '/broadcasting/auth'
  }

  const resolvedBaseUrl = new URL(baseUrl, window.location.origin)

  if (resolvedBaseUrl.pathname.endsWith('/api')) {
    resolvedBaseUrl.pathname = resolvedBaseUrl.pathname.slice(0, -4) || '/'
  }

  resolvedBaseUrl.pathname = `${resolvedBaseUrl.pathname.replace(/\/$/, '')}/broadcasting/auth`

  return resolvedBaseUrl.toString()
}

function createEcho(token: string) {
  const appKey = import.meta.env.VITE_REVERB_APP_KEY
  if (!appKey) return null

  const wsHost = import.meta.env.VITE_REVERB_HOST || window.location.hostname
  const wsPort = Number(import.meta.env.VITE_REVERB_PORT || 8080)
  const scheme =
    import.meta.env.VITE_REVERB_SCHEME ||
    (window.location.protocol === 'https:' ? 'https' : 'http')

  ;(
    window as typeof window & {
      Pusher?: typeof Pusher
    }
  ).Pusher = Pusher

  return new Echo<'reverb'>({
    broadcaster: 'reverb',
    key: appKey,
    wsHost,
    wsPort,
    wssPort: wsPort,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: getBroadcastAuthEndpoint(),
    auth: {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  })
}

export function getRealtimeEcho() {
  if (typeof window === 'undefined') return null

  const session = getAuthSession()
  if (!session?.token) {
    disconnectRealtimeEcho()
    return null
  }

  if (echoInstance && echoToken === session.token) {
    return echoInstance
  }

  disconnectRealtimeEcho()
  echoToken = session.token
  echoInstance = createEcho(session.token)

  return echoInstance
}

export function disconnectRealtimeEcho() {
  if (echoInstance) {
    echoInstance.disconnect()
  }

  echoInstance = null
  echoToken = null
}

export const getChatEcho = getRealtimeEcho
export const disconnectChatEcho = disconnectRealtimeEcho
