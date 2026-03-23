import type { AuditLogItem, AuditLogRoleSlug } from './api'

/** Text inside trailing "(...)" from API `actor` (role name or code). */
function actorRoleToken(actor: string): string | null {
  const m = actor.match(/\(([^)]+)\)\s*$/)
  if (!m) return null
  return m[1].trim().toLowerCase()
}

/**
 * Client-side role filter (no API support). Matches `actor` suffix from
 * `AuditLogResource`: "Name (Admin)" / "Name (STAFF)" etc.
 */
export function filterAuditLogsByRoleSlugs(
  rows: AuditLogItem[],
  slugs: AuditLogRoleSlug[]
): AuditLogItem[] {
  if (slugs.length === 0) return rows

  const wanted = new Set(slugs.map(s => s.toLowerCase()))

  return rows.filter(row => {
    const token = actorRoleToken(row.actor)
    if (token === null) return false
    if (token === 'service') return false
    return wanted.has(token)
  })
}
