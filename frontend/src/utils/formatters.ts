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
