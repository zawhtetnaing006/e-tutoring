import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, LogOut } from 'lucide-react'
import { paths } from '@/routes/index'
import { useRole } from '@/features/auth/useRole'
import { useCurrentUser } from '@/features/auth/useCurrentUser'
import { logout } from '@/features/auth/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  )
}

const roleLabels = new Map<string, string>([
  ['staff', 'Admin Access'],
  ['tutor', 'Tutor Access'],
  ['student', 'Student'],
])

type ValidRole = 'staff' | 'tutor' | 'student'

interface SidebarUserSectionProps {
  isCollapsed?: boolean
}

export function SidebarUserSection({
  isCollapsed = false,
}: SidebarUserSectionProps) {
  const role = useRole()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: user, isLoading } = useCurrentUser()
  const label = roleLabels.get(role as ValidRole) ?? 'Guest'

  const handleSignOut = async () => {
    setOpen(false)
    await logout()
    // Clear all cached queries so the next user never sees the previous user's data
    // (notifications, lists, etc. were still served from cache after only removing auth/me).
    queryClient.clear()
    navigate(paths.public.login)
    toast.success('Logged out successfully')
  }

  const displayName = user?.name ?? 'User'
  const displayEmail = user?.email ?? ''
  const initials = getInitials(displayName)
  const profileImageUrl = user?.profile_image_url

  if (isCollapsed) {
    return (
      <div className="relative mt-auto border-t border-border pt-4">
        <div
          className={cn(
            'absolute bottom-full left-full mb-1 ml-2 w-56 origin-bottom-left rounded-lg border border-border bg-background shadow-lg transition-all duration-200 ease-in-out',
            open
              ? 'visible scale-100 opacity-100'
              : 'pointer-events-none invisible scale-95 opacity-0'
          )}
          role="menu"
        >
          <div className="p-3">
            <p className="mb-1 truncate text-body font-semibold text-foreground">
              {displayName}
            </p>
            <p className="mb-3 truncate text-subtext text-muted-foreground">
              {displayEmail}
            </p>
            <div className="my-2 border-t border-border" />
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-body font-medium text-foreground transition-colors duration-150 hover:bg-muted"
            >
              <LogOut className="size-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className="flex w-full items-center justify-center rounded-md px-2 py-2 transition-all duration-200 hover:bg-muted/50"
          aria-expanded={open}
          aria-haspopup="menu"
          title={displayName}
        >
          <div
            className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-subtext font-semibold text-foreground transition-transform duration-200 hover:scale-105"
            aria-hidden
          >
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : isLoading ? (
              '…'
            ) : (
              initials
            )}
          </div>
        </button>
      </div>
    )
  }

  return (
    <div className="relative mt-auto border-t border-border pt-4">
      <div
        className={cn(
          'absolute bottom-full left-0 right-0 mb-1 origin-bottom rounded-lg border border-border bg-background shadow-lg transition-all duration-200 ease-in-out',
          open
            ? 'visible scale-100 opacity-100'
            : 'pointer-events-none invisible scale-95 opacity-0'
        )}
        role="menu"
      >
        <div className="p-3">
          <p className="mb-3 truncate text-subtext text-muted-foreground">
            {displayEmail}
          </p>
          <div className="my-2 border-t border-border" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-body font-medium text-foreground transition-colors duration-150 hover:bg-muted"
          >
            <LogOut className="size-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full items-center gap-3 rounded-md px-2 py-2 transition-all duration-200 hover:bg-muted/50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div
          className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-subtext font-semibold text-foreground transition-transform duration-200 hover:scale-105"
          aria-hidden
        >
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : isLoading ? (
            '…'
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left transition-all duration-300 ease-in-out">
          <p className="truncate text-body font-semibold text-foreground">
            {isLoading ? 'Loading…' : displayName}
          </p>
          <p className="truncate text-subtext text-muted-foreground">{label}</p>
        </div>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>
    </div>
  )
}
