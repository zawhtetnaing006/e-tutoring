import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Injects the official GA4 snippet order: async gtag/js → inline dataLayer + gtag + config.
// Page navigations are handled in `src/lib/google-analytics.ts` (manual page_view only).

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const gaId = env.VITE_GA_MEASUREMENT_ID?.trim() ?? ''
  const gaIdValid = /^G-[A-Z0-9]+$/i.test(gaId)
  const isDev = mode === 'development'

  return {
    plugins: [
      react(),
      {
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
      },
    ],
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
