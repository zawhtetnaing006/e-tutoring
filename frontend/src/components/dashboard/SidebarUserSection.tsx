import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import { paths } from '@/routes/index'
import { useRole } from '@/features/auth/useRole'
import { cn } from '@/lib/utils'

/** Placeholder user until auth is wired. */
const placeholderUser = {
  name: 'John Mathan',
  email: 'example@gmail.com',
  initials: 'JM',
}

const roleLabels: Record<string, string> = {
  staff: 'Admin Access',
  tutor: 'Tutor Access',
  student: 'Student',
}

export function SidebarUserSection() {
  const role = useRole()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleSignOut = () => {
    setOpen(false)
    navigate(paths.public.login)
    // TODO: clear auth state when auth is implemented
  }

  return (
    <div className="relative mt-auto border-t border-border pt-4">
      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-background p-3 shadow-md"
          role="menu"
        >
          <p className="truncate text-subtext text-muted-foreground underline">
            {placeholderUser.email}
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
          {placeholderUser.initials}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-body font-semibold text-foreground">
            {placeholderUser.name}
          </p>
          <p className="truncate text-subtext text-muted-foreground">
            {roleLabels[role] ?? role}
          </p>
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
