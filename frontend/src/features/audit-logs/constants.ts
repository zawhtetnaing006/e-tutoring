import type { AuditLogRoleSlug } from './api'

export const AUDIT_LOG_ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const

export const AUDIT_LOG_ROLE_FILTER_OPTIONS: {
  value: AuditLogRoleSlug
  label: string
}[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'student', label: 'Student' },
  { value: 'tutor', label: 'Tutor' },
]

/** Matches filter panel width and positioning in `AuditLogRoleFilterPanel`. */
export const AUDIT_LOG_ROLE_FILTER_PANEL_WIDTH_PX = 220
