const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Sends a GA4 `page_view` on each SPA route (gtag + config are loaded from index.html via Vite).
 *
 * Hits go from the **browser** to Google (`google-analytics.com` / `googletagmanager.com`), not through
 * the Laravel API. In DevTools → Network, filter by `collect` or `google`.
 */
export function trackGaPageView(pathWithSearch: string): void {
  if (!MEASUREMENT_ID?.trim()) {
    return
  }

  // Global `gtag` is defined by the snippet in index.html (injected at build time when VITE_GA_MEASUREMENT_ID is set).
  const gtag = window.gtag
  if (typeof gtag !== 'function') {
    return
  }

  queueMicrotask(() => {
    gtag('event', 'page_view', {
      page_path: pathWithSearch,
      page_location: `${window.location.origin}${pathWithSearch}`,
      page_title: document.title,
    })
  })
}
