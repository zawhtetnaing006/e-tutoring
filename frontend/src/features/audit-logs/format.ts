import type { AuditLogItem } from './api'

export function formatAuditLogDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function auditLogRowKey(row: AuditLogItem): string {
  return String(row.id)
}

function humanizeAuditText(value: string | null | undefined): string {
  const normalized = (value ?? '').trim()
  if (!normalized) return 'â€”'

  return normalized.replace(/#(\d+)/g, ' $1').replace(/\s+/g, ' ').trim()
}

export function formatAuditLogTarget(target: string | null | undefined): string {
  return humanizeAuditText(target)
}

export function formatAuditLogDescription(
  description: string | null | undefined
): string {
  return humanizeAuditText(description)
}
