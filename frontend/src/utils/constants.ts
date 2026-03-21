export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const

export const DEFAULT_PAGE_SIZE = 10

export const FILE_SIZE_LIMITS = {
  IMAGE: 5, // MB
  DOCUMENT: 10, // MB
  VIDEO: 50, // MB
} as const

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
] as const

export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  INPUT: 500,
  RESIZE: 150,
} as const

export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  INPUT: 'YYYY-MM-DD',
  DATETIME: 'MMM DD, YYYY HH:mm',
  TIME: 'HH:mm',
} as const

export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export const QUERY_KEYS = {
  USERS: 'users',
  USER: 'user',
  SUBJECTS: 'subjects',
  SUBJECT: 'subject',
  BLOGS: 'blogs',
  BLOG: 'blog',
  MEETINGS: 'meetings',
  MEETING: 'meeting',
  ALLOCATIONS: 'allocations',
  ALLOCATION: 'allocation',
  CHAT: 'chat',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  AUTH: 'auth',
  CURRENT_USER: 'current-user',
} as const
