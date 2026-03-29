import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackGaPageView } from '@/lib/google-analytics'

/**
 * Records GA4 `page_view` on each client-side navigation (and after gtag loads).
 */
export function GoogleAnalyticsRouteTracker() {
  const location = useLocation()

  useEffect(() => {
    const path = `${location.pathname}${location.search}${location.hash}`
    trackGaPageView(path)
  }, [location.pathname, location.search, location.hash])

  return null
}
