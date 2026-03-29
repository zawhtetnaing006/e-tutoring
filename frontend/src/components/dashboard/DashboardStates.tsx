type DashboardErrorStateProps = {
  message: string
}

export function DashboardLoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div
          className="inline-block size-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
          aria-hidden
        />
        <p className="mt-2 text-sm text-gray-600">Loading dashboard...</p>
      </div>
    </div>
  )
}

export function DashboardErrorState({ message }: DashboardErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-800">
        Failed to load dashboard data: {message}
      </p>
    </div>
  )
}
