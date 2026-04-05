export function formatDateTime(
  iso: string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }

    return date
      .toLocaleString(undefined, { ...defaultOptions, ...options })
      .replace(/\//g, '-')
  } catch {
    return iso
  }
}

export function formatDate(iso: string): string {
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return iso
  }
}

export function formatTime(iso: string): string {
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso

    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
}

export function formatAddress(parts: {
  address?: string | null
  township?: string | null
  city?: string | null
  country?: string | null
}): string {
  const addressParts = [
    parts.address,
    parts.township,
    parts.city,
    parts.country,
  ].filter(Boolean) as string[]

  return addressParts.length > 0 ? addressParts.join(', ') : '—'
}

const FILE_SIZES = ['Bytes', 'KB', 'MB', 'GB', 'TB'] as const

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    FILE_SIZES.length - 1
  )
  // eslint-disable-next-line security/detect-object-injection
  const size = FILE_SIZES[i]

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${size}`
}

export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '—'
  return phone
}

export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Parse analytics timestamps for display in the browser's local timezone.
 * - ISO 8601 from the API (`toIso8601String`) encodes the real instant.
 * - Legacy `Y/m/d H:i` strings were UTC wall-clock without a zone; treat as UTC.
 */
export function parseLastLoginToLocalDate(value: string): Date | null {
  const trimmed = value.trim()
  const slash = trimmed.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/)
  if (slash) {
    const y = Number(slash[1])
    const mo = Number(slash[2]) - 1
    const d = Number(slash[3])
    const h = Number(slash[4])
    const min = Number(slash[5])
    const date = new Date(Date.UTC(y, mo, d, h, min))
    return Number.isNaN(date.getTime()) ? null : date
  }
  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Dashboard last-login: local timezone, `2026/03/29 12:08 AM` (slashes, 12h, no seconds).
 * Accepts ISO 8601 or legacy UTC `Y/m/d H:i`; invalid values pass through.
 */
export function formatLastLoginDisplay(
  value: string | null | undefined
): string {
  if (value == null || value === '') return '—'
  const trimmed = value.trim()
  try {
    const date = parseLastLoginToLocalDate(trimmed)
    if (date === null) return trimmed
    const y = date.getFullYear()
    const mo = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    let hour = date.getHours()
    const ampm = hour >= 12 ? 'PM' : 'AM'
    hour = hour % 12
    if (hour === 0) hour = 12
    const hStr = String(hour)
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}/${mo}/${d} ${hStr}:${min} ${ampm}`
  } catch {
    return trimmed
  }
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
})

function formatFriendlyAbsoluteInstant(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * "Last interaction" style copy: relative when recent ("2 hours ago"), otherwise
 * a locale-aware absolute line (e.g. "Apr 5, 2026, 1:59 PM") without raw ISO-style digits.
 */
export function formatLastInteractionDisplay(
  value: string | null | undefined
): string {
  if (value == null || value === '') return '—'
  const trimmed = value.trim()
  const date = parseLastLoginToLocalDate(trimmed)
  if (date === null) return trimmed

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 0) {
    return formatFriendlyAbsoluteInstant(date)
  }

  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 45) {
    return 'Just now'
  }

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 1) {
    return 'Just now'
  }
  if (diffMin < 60) {
    return relativeTimeFormatter.format(-diffMin, 'minute')
  }

  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) {
    return relativeTimeFormatter.format(-diffH, 'hour')
  }

  const diffDays = Math.floor(diffH / 24)
  if (diffDays < 7) {
    return relativeTimeFormatter.format(-diffDays, 'day')
  }

  return formatFriendlyAbsoluteInstant(date)
}

/** en-US date/time without seconds (matches legacy blog list formatting). */
export function formatDateTimeShort(iso: string): string {
  if (!iso) return '-'
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return iso
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function escapeCsvCell(value: unknown): string {
  return `"${String(value).replaceAll('"', '""')}"`
}

export function buildCsv(rows: unknown[][]): string {
  return rows.map(row => row.map(escapeCsvCell).join(',')).join('\n')
}
