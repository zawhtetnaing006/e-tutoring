import type { AuditLogItem } from './api'

export type AuditLogSortKey =
  | 'date_time'
  | 'actor'
  | 'action'
  | 'target'
  | 'description'

export type AuditLogSortDir = 'asc' | 'desc'

function sortableStringForColumn(
  row: AuditLogItem,
  key: Exclude<AuditLogSortKey, 'date_time'>
): string {
  switch (key) {
    case 'actor':
      return row.actor
    case 'action':
      return row.action
    case 'target':
      return row.target
    case 'description':
      return row.description
    default: {
      const _exhaustive: never = key
      return _exhaustive
    }
  }
}

export function compareAuditLogRows(
  a: AuditLogItem,
  b: AuditLogItem,
  key: AuditLogSortKey,
  dir: AuditLogSortDir
): number {
  const inv = dir === 'asc' ? 1 : -1
  if (key === 'date_time') {
    const ta = a.date_time ? new Date(a.date_time).getTime() : 0
    const tb = b.date_time ? new Date(b.date_time).getTime() : 0
    if (ta !== tb) return (ta - tb) * inv
    return (a.id - b.id) * inv
  }
  const sa = String(sortableStringForColumn(a, key) ?? '')
  const sb = String(sortableStringForColumn(b, key) ?? '')
  const c = sa.localeCompare(sb, undefined, { sensitivity: 'base' })
  if (c !== 0) return c * inv
  return (a.id - b.id) * inv
}

export function ariaSortForAuditColumn(
  activeKey: AuditLogSortKey,
  dir: AuditLogSortDir,
  columnKey: AuditLogSortKey
): 'ascending' | 'descending' | 'none' {
  if (activeKey !== columnKey) return 'none'
  return dir === 'asc' ? 'ascending' : 'descending'
}
