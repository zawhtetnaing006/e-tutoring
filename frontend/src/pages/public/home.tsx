import { useHealthCheck } from '@/hooks'

export function HomePage() {
  const { data, isLoading, isError, error } = useHealthCheck()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-semibold text-foreground">E-Tutoring</h1>
      <p className="mt-2 text-muted-foreground">
        Frontend is set up with React Query, React Router, and shadcn/ui.
      </p>
      <div className="mt-6 rounded-md border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
        {isLoading && 'Checking Laravel API…'}
        {isError && `API: ${error instanceof Error ? error.message : 'Error'}`}
        {data && `API: ${data.app} — ${data.status}`}
      </div>
    </main>
  )
}
