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

export function SidebarUserSection() {
  const role = useRole()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data: user, isLoading } = useCurrentUser()
  const label = roleLabels.get(role as ValidRole) ?? 'Guest'

  const handleSignOut = async () => {
    setOpen(false)
    await logout()
    queryClient.removeQueries({ queryKey: ['auth', 'me'] })
    navigate(paths.public.login)
    toast.success('Logged out successfully')
  }

  const displayName = user?.name ?? 'User'
  const displayEmail = user?.email ?? ''
  const initials = getInitials(displayName)

  return (
    <div className="relative mt-auto border-t border-border pt-4">
      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-background p-3 shadow-md"
          role="menu"
        >
          <p className="truncate text-subtext text-muted-foreground underline">
            {displayEmail}
          </p>
          <div className="my-2 border-t border-border" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-body font-medium text-foreground hover:bg-muted"
          >
            <LogOut className="size-4 shrink-0" />
            Sign Out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-subtext font-semibold text-foreground"
          aria-hidden
        >
          {isLoading ? '…' : initials}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-body font-semibold text-foreground">
            {isLoading ? 'Loading…' : displayName}
          </p>
          <p className="truncate text-subtext text-muted-foreground">{label}</p>
        </div>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-muted-foreground',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>
    </div>
  )
}
