/** Short axis labels; full text stays in data for tooltips. */
export const PAGE_AXIS_MAX = 12
export const TUTOR_AXIS_MAX = 16

export function truncateChartLabel(value: unknown, maxLen: number): string {
  if (value == null) return ''
  const s = String(value)
  if (s.length <= maxLen) return s
  return `${s.slice(0, Math.max(0, maxLen - 1))}…`
}
