import { AUDIT_LOG_ROLE_FILTER_PANEL_WIDTH_PX } from './constants'

export type AuditLogFilterAnchorRect = {
  top: number
  left: number
}

export function computeAuditLogFilterDropdownRect(
  triggerRect: DOMRectReadOnly
): AuditLogFilterAnchorRect {
  return {
    top: triggerRect.bottom + 4,
    left: Math.min(
      triggerRect.left,
      window.innerWidth - AUDIT_LOG_ROLE_FILTER_PANEL_WIDTH_PX - 8
    ),
  }
}
