/**
 * Auth roles aligned with eTutoring spec:
 * - student
 * - tutor
 * - staff
 */
export type AuthRole = 'student' | 'tutor' | 'staff'

export type UserType = 'STUDENT' | 'TUTOR' | 'STAFF' | string

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
  is_active: boolean
  user_type: UserType
  subjects?: string | null
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
