import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { queryClient } from '@/lib/query-client'
import { Toaster } from '@/components/ui/sonner'
import { GoogleAnalyticsRouteTracker } from '@/components/GoogleAnalyticsRouteTracker'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GoogleAnalyticsRouteTracker />
        {children}
      </BrowserRouter>
      <Toaster richColors position="top-right" />
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
