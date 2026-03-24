export const CACHE_TTL_SECONDS = {
  coursesAll: 300,
  dashboardUser: 120,
  enrollmentsUser: 120,
  profileUser: 300,
} as const

export const CacheKeys = {
  coursesAll: () => 'courses:all',
  dashboardUser: (userId: number) => `dashboard:user:${userId}`,
  enrollmentsUser: (userId: number) => `enrollments:user:${userId}`,
  profileUser: (userId: number) => `profile:user:${userId}`,
} as const
