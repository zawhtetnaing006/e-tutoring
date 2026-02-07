/**
 * Auth roles aligned with eTutoring spec:
 * - student
 * - tutor
 * - staff
 */
export type AuthRole = 'student' | 'tutor' | 'staff'

/** User from MIS (read-only in this system). */
// export type User = { id: string; email: string; role: AuthRole; name?: string; ... }
// export type LoginPayload = { email: string; password: string }
