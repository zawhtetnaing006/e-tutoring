import type { Plugin } from 'vite'

export type GoogleAnalyticsInjectOptions = {
  mode: string
  /** From `loadEnv` / `VITE_GA_MEASUREMENT_ID` */
  measurementId: string
}

/**
 * Injects the GA4 gtag snippet into `index.html` when the measurement ID is valid (G-…).
 * Order: async gtag/js → dataLayer + gtag + config with `send_page_view: false` (first paint has no
 * automatic page_view; `GoogleAnalyticsRouteTracker` sends each route via `gtag('config', …)`).
 * If you see two `collect` hits per route, turn off Enhanced measurement → Page views for this stream
 * in GA4 so history-based page_view does not duplicate the SPA tracker.
 */
export function googleAnalyticsInjectPlugin(
  options: GoogleAnalyticsInjectOptions
): Plugin {
  const gaId = options.measurementId.trim()
  const gaIdValid = /^G-[A-Z0-9]+$/i.test(gaId)
  const isDev = options.mode === 'development'

  return {
    name: 'inject-google-tag',
    transformIndexHtml(html) {
      if (!gaIdValid) {
        return html
      }
      const escapedId = gaId.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      const debugConfig = isDev ? ', debug_mode: true' : ''
      const snippet = `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${escapedId}', { send_page_view: false${debugConfig} });
    </script>`
      return html.replace('</head>', `${snippet}\n  </head>`)
    },
  }
}
