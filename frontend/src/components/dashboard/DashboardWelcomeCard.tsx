import type { ReactNode } from 'react'
import { MessageSquare } from 'lucide-react'

type DashboardWelcomeCardProps = {
  heading: ReactNode
  children: ReactNode
}

export function DashboardWelcomeCard({
  heading,
  children,
}: DashboardWelcomeCardProps) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
      <div className="flex items-start gap-2 sm:gap-3">
        <MessageSquare
          className="mt-0.5 size-4 shrink-0 text-blue-600 sm:size-5"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
            {heading}
          </h2>
          {children}
        </div>
      </div>
    </div>
  )
}
