/**
 * Route paths (basic structure). Expand when adding features.
 */
export const paths = {
  public: {
    home: '/',
    login: '/login',
  },
  student: {
    dashboard: '/student',
  },
  tutor: {
    dashboard: '/tutor',
  },
  admin: {
    dashboard: '/admin',
  },
} as const

export type PathKey = keyof typeof paths
export type PublicPathKey = keyof typeof paths.public
export type StudentPathKey = keyof typeof paths.student
export type TutorPathKey = keyof typeof paths.tutor
export type AdminPathKey = keyof typeof paths.admin
