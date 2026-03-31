import { useEffect, useMemo } from 'react'

const STORAGE_PREFIX = 'etutor_dashboard_welcome_seen'

/**
 * Shows the dashboard welcome card only on the first dashboard visit for this user (per browser).
 */
export function useDashboardWelcomeFirstVisit(
  userId: number | undefined
): boolean {
  const showWelcome = useMemo(() => {
    if (userId == null || typeof window === 'undefined') {
      return false
    }
    try {
      return !window.localStorage.getItem(`${STORAGE_PREFIX}_${userId}`)
    } catch {
      return true
    }
  }, [userId])

  useEffect(() => {
    if (userId == null || !showWelcome) {
      return
    }
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}_${userId}`, '1')
    } catch {
      // ignore quota / private mode
    }
  }, [userId, showWelcome])

  return showWelcome
}
