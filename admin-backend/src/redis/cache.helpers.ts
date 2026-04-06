export const CACHE_TTL_SECONDS = {
  coursesAll: 300,
  coursesUser: 300,
  dashboardUser: 120,
  enrollmentsUser: 120,
  profileUser: 300,
  modulesCourse: 600,
  moduleDocuments: 600,
  moduleActivities: 600,
  moduleProgressUserCourse: 120,
  moduleQuestions: 600,
  finalQuizQuestions: 600,
  quizAttemptsUserCourse: 180,
  finalQuizAttemptsUserCourse: 180,
} as const

export const TIMER_TTL_SECONDS = {
  moduleQuiz: 20 * 60,
  finalQuiz: 30 * 60,
} as const

export const METRIC_TTL_SECONDS = {
  dailyMetric: 90 * 24 * 60 * 60,
} as const

export const CacheKeys = {
  coursesAll: () => 'courses:all',
  coursesUser: (userId: number) => `courses:user:${userId}`,
  dashboardUser: (userId: number) => `dashboard:user:${userId}`,
  enrollmentsUser: (userId: number) => `enrollments:user:${userId}`,
  profileUser: (userId: number) => `profile:user:${userId}`,
  modulesCourse: (courseId: number) => `modules:course:${courseId}`,
  moduleDocuments: (moduleId: number) => `module-documents:${moduleId}`,
  moduleActivities: (moduleId: number) => `module-activities:${moduleId}`,
  moduleProgressUserCourse: (userId: number, courseId: number) =>
    `module-progress:user:${userId}:course:${courseId}`,
  moduleQuestions: (courseId: number, moduleId: number) =>
    `questions:module:course:${courseId}:module:${moduleId}`,
  finalQuizQuestions: (courseId: number) => `questions:final-quiz:course:${courseId}`,
  quizAttemptsUserCourse: (userId: number, courseId: number) =>
    `quiz-attempts:user:${userId}:course:${courseId}`,
  finalQuizAttemptsUserCourse: (userId: number, courseId: number) =>
    `final-quiz-attempts:user:${userId}:course:${courseId}`,
} as const

export const TimerKeys = {
  moduleQuiz: (userId: number, courseId: number, moduleId: number) =>
    `timer:module-quiz:user:${userId}:course:${courseId}:module:${moduleId}`,
  finalQuiz: (userId: number, courseId: number) =>
    `timer:final-quiz:user:${userId}:course:${courseId}`,
} as const

export const MetricKeys = {
  daily: (date: string, metricName: string) => `metrics:${date}:${metricName}`,
} as const

export const MetricNames = {
  authLoginSuccess: 'auth-login-success',
  authLoginFailure: 'auth-login-failure',
  signupSuccess: 'signup-success',
  enrollmentsCreated: 'enrollments-created',
  moduleQuizSubmitted: 'module-quiz-submitted',
  moduleQuizPassed: 'module-quiz-passed',
  finalQuizSubmitted: 'final-quiz-submitted',
  finalQuizPassed: 'final-quiz-passed',
  evaluationSubmitted: 'evaluation-submitted',
  projectsSubmitted: 'projects-submitted',
  videosSubmitted: 'videos-submitted',
} as const

export const RateLimitKeys = {
  scope: (scope: string, identifier: string) => `rate-limit:${scope}:${identifier}`,
} as const
