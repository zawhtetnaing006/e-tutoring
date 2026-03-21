import { createPortal } from 'react-dom'
import { UserCheck, UserX } from 'lucide-react'
import type { Subject } from '@/features/subjects/api'

export interface SubjectStaffActionsPortalProps {
  row: Subject | undefined
  dropdownRect: { top: number; left: number; right: number } | null
  onClose: () => void
  onSetActive: (id: number, isActive: boolean) => void
  isPending: boolean
  activeLabel?: string
  inactiveLabel?: string
}

const MENU_WIDTH = 180

export function SubjectStaffActionsPortal({
  row,
  dropdownRect,
  onClose,
  onSetActive,
  isPending,
  activeLabel = 'Active Subject',
  inactiveLabel = 'Inactive Subject',
}: SubjectStaffActionsPortalProps) {
  if (!dropdownRect || !row) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100]" aria-hidden onClick={onClose} />
      <div
        className="fixed z-[101] min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg"
        style={{
          top: dropdownRect.top + 4,
          left: Math.max(8, dropdownRect.right - MENU_WIDTH),
        }}
      >
        <button
          type="button"
          onClick={() => onSetActive(row.id, true)}
          disabled={isPending}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-green-600 hover:bg-muted dark:text-green-400"
        >
          <UserCheck className="h-4 w-4 shrink-0" />
          {activeLabel}
        </button>
        <button
          type="button"
          onClick={() => onSetActive(row.id, false)}
          disabled={isPending}
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-muted dark:text-red-400"
        >
          <UserX className="h-4 w-4 shrink-0" />
          {inactiveLabel}
        </button>
      </div>
    </>,
    document.body
  )
}
