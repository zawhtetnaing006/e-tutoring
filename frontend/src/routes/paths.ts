/**
 * Route paths. Root is dashboard; login is public.
 */
export const paths = {
  public: {
    login: '/login',
  },
  dashboard: '/',
  allocations: '/allocations',
} as const

export type PathKey = keyof typeof paths
export type PublicPathKey = keyof typeof paths.public
