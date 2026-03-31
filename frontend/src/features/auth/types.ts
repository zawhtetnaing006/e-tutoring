/**
 * Auth roles aligned with eTutoring spec:
 * - student
 * - tutor
 * - staff
 */
export type AuthRole = 'student' | 'tutor' | 'staff'

export type UserRoleCode = 'ADMIN' | 'STAFF' | 'TUTOR' | 'STUDENT' | string

export type SubjectRef = {
  id: number
  name: string
  description: string
}

export type User = {
  id?: number
  uuid: string
  name: string
  email: string
  phone: string | null
  address: string | null
  country?: string | null
  city?: string | null
  township?: string | null
  profile_image_url: string | null
  is_active: boolean
  role_code: UserRoleCode | null
  role_name?: string | null
  subjects?: SubjectRef[]
  created_at: string
  updated_at: string
}

export type LoginResponse = {
  token: string
  token_type: 'Bearer'
  user: User
}

export type AuthSession = {
  token: string
  tokenType: string
  user: User
}
