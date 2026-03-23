import { createPortal } from 'react-dom'
import { AUDIT_LOG_ROLE_FILTER_OPTIONS } from './constants'
import type { AuditLogRoleSlug } from './api'
import type { AuditLogFilterAnchorRect } from './auditLogRoleFilterPlacement'

type AuditLogRoleFilterPanelProps = {
  open: boolean
  anchorRect: AuditLogFilterAnchorRect | null
  selectedRoles: AuditLogRoleSlug[]
  onToggleRole: (role: AuditLogRoleSlug) => void
  onClearRoles: () => void
  onClose: () => void
}

export function AuditLogRoleFilterPanel({
  open,
  anchorRect,
  selectedRoles,
  onToggleRole,
  onClearRoles,
  onClose,
}: AuditLogRoleFilterPanelProps) {
  if (!open || !anchorRect) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-[100]" aria-hidden onClick={onClose} />
      <div
        id="audit-log-role-filter-panel"
        role="dialog"
        aria-label="Filter by actor role"
        className="fixed z-[101] w-[min(calc(100vw-1rem),220px)] rounded-lg border border-border bg-card py-2 shadow-lg 2xl:rounded-xl 2xl:py-3"
        style={{
          top: anchorRect.top,
          left: anchorRect.left,
        }}
      >
        <p className="px-3 pb-2 text-xs font-medium text-muted-foreground 2xl:text-sm">
          Actor role
        </p>
        {AUDIT_LOG_ROLE_FILTER_OPTIONS.map(opt => (
          <label
            key={opt.value}
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-muted 2xl:gap-3 2xl:px-4 2xl:py-2.5 2xl:text-base"
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input 2xl:h-5 2xl:w-5"
              checked={selectedRoles.includes(opt.value)}
              onChange={() => onToggleRole(opt.value)}
            />
            {opt.label}
          </label>
        ))}
        {selectedRoles.length > 0 && (
          <button
            type="button"
            onClick={onClearRoles}
            className="mt-1 w-full border-t border-border px-3 pt-2 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground 2xl:px-4 2xl:pt-3 2xl:text-sm"
          >
            Clear roles
          </button>
        )}
      </div>
    </>,
    document.body
  )
}
