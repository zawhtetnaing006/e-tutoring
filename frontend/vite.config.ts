import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { googleAnalyticsInjectPlugin } from './vite-plugin-google-analytics'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const gaMeasurementId = env.VITE_GA_MEASUREMENT_ID?.trim() ?? ''

  return {
    plugins: [
      react(),
      googleAnalyticsInjectPlugin({ mode, measurementId: gaMeasurementId }),
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
