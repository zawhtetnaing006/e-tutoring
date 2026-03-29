const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

/** True when `VITE_GA_MEASUREMENT_ID` is set (build-time); matches Vite’s G-… validation for the snippet. */
export function isGoogleAnalyticsEnabled(): boolean {
  return Boolean(MEASUREMENT_ID?.trim())
}

/** Suppress duplicate `page_view` in quick succession (e.g. React Strict Mode dev double effect). */
const DEDUPE_MS = 400
let lastPagePathSent = ''
let lastPageViewSentAt = 0

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Records a virtual page view on each SPA route (initial `gtag('config')` uses `send_page_view: false`
 * in `index.html`; each navigation updates the measurement ID config with the new path).
 *
 * **Duplicate `collect` requests:** GA4 Enhanced measurement → “Page views” also fires on browser
 * history changes (React Router). That stacks with this call → two `page_view` hits per route.
 * Fix in GA4: Admin → Data streams → your Web stream → Enhanced measurement → turn **Page views**
 * off (gear: you can disable page changes on browser history only), so only this tracker counts SPA
 * routes. See https://support.google.com/analytics/answer/9216061
 *
 * Hits go to Google (`google-analytics.com` / `googletagmanager.com`), not the Laravel API.
 */
export function trackGaPageView(pathWithSearch: string): void {
  const measurementId = MEASUREMENT_ID?.trim()
  if (!measurementId) {
    return
  }

  const now = Date.now()
  if (
    pathWithSearch === lastPagePathSent &&
    now - lastPageViewSentAt < DEDUPE_MS
  ) {
    return
  }
  lastPagePathSent = pathWithSearch
  lastPageViewSentAt = now

  const gtag = window.gtag
  if (typeof gtag !== 'function') {
    return
  }

  queueMicrotask(() => {
    // SPA virtual pageviews: `config` + `page_path` sends one page_view (recommended over `event`).
    gtag('config', measurementId, {
      page_path: pathWithSearch,
      page_location: `${window.location.origin}${pathWithSearch}`,
      page_title: document.title,
    })
  })
}
