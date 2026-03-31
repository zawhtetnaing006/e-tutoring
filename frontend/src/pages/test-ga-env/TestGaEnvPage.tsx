import { useEffect } from 'react'

export function TestGaEnvPage() {
  useEffect(() => {
    console.log(
      'VITE_GA_MEASUREMENT_ID:',
      import.meta.env.VITE_GA_MEASUREMENT_ID ?? '(unset)'
    )
  }, [])

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <h1 className="text-2xl font-semibold">GA Env Test</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Open the browser console to see the logged value.
      </p>
      <pre className="mt-6 rounded-lg border border-border bg-card p-4 text-sm">
        {import.meta.env.VITE_GA_MEASUREMENT_ID ?? '(unset)'}
      </pre>
    </div>
  )
}
