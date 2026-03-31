export type StatusFilter = 'all' | 'active' | 'inactive'

export type UserRole = 'staff' | 'tutor' | 'student'

export interface StatusOption {
  value: StatusFilter
  label: string
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export const BLOG_STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-600',
  inactive: 'bg-rose-100 text-rose-600',
} as const
