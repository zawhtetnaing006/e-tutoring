import { Info } from 'lucide-react'
import { formatLastLoginDisplay } from '@/utils/formatters'

type LastLoginBannerProps = {
  /** From analytics (`lastLoginAt`), or for students optionally `lastActiveAt` when login is unknown. */
  lastLoginAt: string | null
}

/**
 * Compact security notice above the welcome card. Uses the same timestamps as dashboard analytics.
 */
export function LastLoginBanner({ lastLoginAt }: LastLoginBannerProps) {
  const message =
    lastLoginAt == null || lastLoginAt === ''
      ? 'Welcome! This is your first login to the system.'
      : `Last login: ${formatLastLoginDisplay(lastLoginAt)}`

  return (
    <div
      className="mb-4 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2.5 text-sm text-muted-foreground sm:mb-6 sm:px-4"
      role="status"
    >
      <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 break-words">{message}</span>
    </div>
  )
}
