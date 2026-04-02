/**
 * Meeting schedule date/time in the browser's local timezone.
 * HTML date/time inputs are interpreted in local time; avoid `Date` parsing of
 * bare YYYY-MM-DD strings and `toISOString()` for calendar dates.
 */

export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Today as YYYY-MM-DD for `<input type="date" min="…">`. */
export function minLocalDateInputValue(): string {
  return formatLocalYmd(new Date())
}

/**
 * Combine local calendar date (YYYY-MM-DD) and time (HH:mm or HH:mm:ss).
 */
export function localDateTimeFromParts(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  const parts = timeStr.split(':').map(Number)
  const hh = parts[0] ?? 0
  const mm = parts[1] ?? 0
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

/** True if this local start is strictly before the current moment. */
export function isLocalScheduleStartInPast(
  dateStr: string,
  startTimeStr: string
): boolean {
  return localDateTimeFromParts(dateStr, startTimeStr).getTime() < Date.now()
}

export function isEndBeforeOrEqualStart(
  dateStr: string,
  startTime: string,
  endTime: string
): boolean {
  const s = localDateTimeFromParts(dateStr, startTime)
  const e = localDateTimeFromParts(dateStr, endTime)
  return e.getTime() <= s.getTime()
}
