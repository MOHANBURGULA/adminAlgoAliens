"use client"

import { apiClient } from "./axios"

export type CourseDifficulty = "advanced" | "beginner" | "intermediate"

export type Course = {
  id: number
  title: string
  difficulty: string
  createdAt: string
}

export type Enrollment = {
  id: number
  courseId: number
  progress: number
  createdAt: string
}

export type CourseModule = {
  id: number
  courseId: number
  title: string
  orderIndex: number
  createdAt?: string
}

export type ModuleProgress = {
  id?: number
  moduleId: number
  completed: boolean
  quizScore?: number
  completedAt?: string
}

export type ModuleDocument = {
  id: number
  moduleId: number
  label: string
  title: string
  fileUrl: string
  storageKey?:
    | {
        bucket?: string
        key: string
        provider?: string
      }
    | string
    | null
  parseStatus?: string | null
  parseError?: string | null
  pageCount?: number | null
  parsedContent?: ParsedPdfContent | null
  createdAt?: string
}

export type PdfBlock =
  | {
      type: "paragraph"
      text: string
    }
  | {
      type: "bullet-list"
      items: string[]
    }

export type PdfSection = {
  id: string
  title: string
  anchor: string
  pageStart: number
  blocks: PdfBlock[]
}

export type ParsedPdfContent = {
  title: string
  pageCount: number
  wordCount: number
  sectionCount: number
  sections: PdfSection[]
}

export type ActivityType =
  | "SQL_DEBUGGING"
  | "CODE_SNIPPET"
  | "ANALYSIS"
  | "QUIZ"

export type ActivityTestCase = {
  input?: string
  output?: string
  isHidden?: boolean
}

export type ActivityChoice = {
  label: string
}

export type ActivityContent = {
  description: string
  starterCode?: string
  expectedOutput?: string
  testCases?: ActivityTestCase[]
  sqlSchema?: string
  explanation?: string
  language?: string
  choices?: ActivityChoice[]
  correctChoiceIndex?: number
}

export type ModuleActivity = {
  id: number
  moduleId: number
  activityType: ActivityType
  content: ActivityContent
  createdAt: string
  updatedAt: string
}

export type Question = {
  id: number
  questionText: string
  options: string[]
}

export type QuizAttempt = {
  id: number
  userId: number
  courseId: number
  moduleId: number
  answers: Record<number, number>
  score: number
  passed: boolean
  attemptedAt: string
}

export type FinalQuizAttempt = {
  id: number
  userId: number
  courseId: number
  answers: Record<number, number>
  score: number
  passed: boolean
  attemptedAt: string
}

export type ProjectSubmission = {
  id: number
  userId: number
  courseId: number
  githubLink: string
  zipFile?: string
  description: string
  status: string
  feedback?: string
  createdAt: string
}

export type UserVideo = {
  id: number
  userId: number
  title: string
  description: string
  videoUrl: string
  status: string
  createdAt: string
}

export type EvaluationAttempt = {
  id: number
  userId: number
  courseId: number
  videoKey: string
  transcript?: string
  relevanceScore?: number
  aiDetectionScore?: number
  finalScore?: number
  status: string
  feedback?: string
  createdAt: string
}

export type UserProfile = {
  skillLevel: string
  interests: string[]
  goal?: string
}

type SignedUploadResponse = {
  uploadUrl: string
  key: string
}

export const FINAL_EVALUATION_TITLE = "Final Evaluation"

export function normalizeDifficulty(value?: string): CourseDifficulty {
  const normalized = value?.trim().toLowerCase()
  if (normalized === "advanced" || normalized === "beginner" || normalized === "intermediate") {
    return normalized
  }
  return "beginner"
}

export function formatDifficulty(value?: string) {
  const normalized = normalizeDifficulty(value)
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

export function formatRelativeDate(value?: string) {
  if (!value) {
    return "Recently updated"
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function sortModules(modules: CourseModule[]) {
  return [...modules].sort((a, b) => a.orderIndex - b.orderIndex)
}

export function isFinalEvaluationModule(module: Pick<CourseModule, "title">) {
  return module.title.trim().toLowerCase() === FINAL_EVALUATION_TITLE.toLowerCase()
}

export function getMainModules(modules: CourseModule[]) {
  return modules.filter((module) => !isFinalEvaluationModule(module))
}

export function getFinalEvaluationModule(modules: CourseModule[]) {
  return modules.find((module) => isFinalEvaluationModule(module)) || null
}

export function calculateEnrollmentProgress({
  completedMainModules,
  totalMainModules,
  finalQuizPassed,
  hasProjectSubmission,
  hasVideoSubmission,
  hasPassedEvaluation,
}: {
  completedMainModules: number
  totalMainModules: number
  finalQuizPassed: boolean
  hasProjectSubmission: boolean
  hasVideoSubmission: boolean
  hasPassedEvaluation: boolean
}) {
  if (totalMainModules === 0) {
    return 0
  }

  const modulesPortion = Math.round((completedMainModules / totalMainModules) * 80)
  let progress = modulesPortion

  if (finalQuizPassed) {
    progress += 10
  }

  if (hasProjectSubmission) {
    progress += 5
  }

  if (hasVideoSubmission) {
    progress += 2
  }

  if (hasPassedEvaluation) {
    progress += 3
  }

  return Math.min(100, progress)
}

export function findLatestItem<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0] || null
}

export async function fetchCourses() {
  const { data } = await apiClient.get<Course[]>("/api/courses")
  return data
}

export async function fetchCourse(courseId: number) {
  const { data } = await apiClient.get<Course>(`/api/courses/${courseId}`)
  return data
}

export async function fetchEnrollments() {
  const { data } = await apiClient.get<Enrollment[]>("/api/enroll")
  return data
}

export async function enrollInCourse(courseId: number) {
  const { data } = await apiClient.post<Enrollment>("/api/enroll", { courseId })
  return data
}

export async function unenrollFromCourse(enrollmentId: number) {
  const { data } = await apiClient.delete<{ message: string }>(`/api/enroll/${enrollmentId}`)
  return data
}

export async function updateEnrollmentProgress(enrollmentId: number, progress: number) {
  const { data } = await apiClient.put<Enrollment>(`/api/enroll/${enrollmentId}/progress`, {
    progress,
  })
  return data
}

export async function fetchUserProfile() {
  const { data } = await apiClient.get<UserProfile>("/api/profile")
  return data
}

export async function fetchCourseModules(courseId: number) {
  const { data } = await apiClient.get<CourseModule[]>(`/api/courses/${courseId}/modules`)
  return sortModules(data)
}

export async function fetchModuleProgress(courseId: number) {
  const { data } = await apiClient.get<ModuleProgress[]>(
    `/api/courses/${courseId}/modules/progress`,
  )
  return data
}

export async function fetchModuleDocuments(courseId: number, moduleId: number) {
  const { data } = await apiClient.get<ModuleDocument[]>(
    `/api/courses/${courseId}/modules/${moduleId}/documents`,
  )
  return data
}

export async function fetchModuleQuestions(courseId: number, moduleId: number) {
  const { data } = await apiClient.get<Question[]>(
    `/api/courses/${courseId}/modules/${moduleId}/questions`,
  )
  return data
}

export async function fetchModuleActivities(moduleId: number) {
  const { data } = await apiClient.get<ModuleActivity[]>(`/api/activity/${moduleId}`)
  return data
}

export async function submitModuleActivity(payload: {
  activityId: number
  sourceCode?: string
  language?: string
  answer?: string
  selectedOptionIndex?: number
}) {
  const { data } = await apiClient.post<{
    activityId: number
    activityType: ActivityType
    submissionId: number
    result: Record<string, unknown>
  }>("/api/activity/submit", payload)

  return data
}

export async function submitModuleQuiz(
  courseId: number,
  moduleId: number,
  answers: Record<number, number>,
) {
  const { data } = await apiClient.post<{
    score: number
    passed: boolean
    correct: number
    total: number
    message: string
  }>(`/api/courses/${courseId}/modules/${moduleId}/quiz/submit`, { answers })
  return data
}

export async function fetchModuleQuizAttempts(courseId: number, moduleId: number) {
  const { data } = await apiClient.get<QuizAttempt[]>(
    `/api/courses/${courseId}/modules/${moduleId}/quiz/attempts`,
  )
  return data
}

export async function fetchFinalQuizQuestions(courseId: number) {
  const { data } = await apiClient.get<Question[]>(`/api/courses/${courseId}/final-quiz/questions`)
  return data
}

export async function submitFinalQuiz(courseId: number, answers: Record<number, number>) {
  const { data } = await apiClient.post<{
    score: number
    passed: boolean
    correct: number
    total: number
    message: string
  }>(`/api/courses/${courseId}/final-quiz/submit`, { answers })
  return data
}

export async function fetchFinalQuizAttempts(courseId: number) {
  const { data } = await apiClient.get<FinalQuizAttempt[]>(
    `/api/courses/${courseId}/final-quiz/attempts`,
  )
  return data
}

export async function fetchProjects() {
  const { data } = await apiClient.get<ProjectSubmission[]>("/api/projects")
  return data
}

export async function submitProjectSubmission(payload: {
  courseId: number
  githubLink: string
  description: string
  zipFile?: string
}) {
  const { data } = await apiClient.post<ProjectSubmission>("/api/projects", payload)
  return data
}

export async function fetchVideos() {
  const { data } = await apiClient.get<UserVideo[]>("/api/videos")
  return data
}

export async function createVideoRecord(payload: {
  courseId: number
  title: string
  description: string
  videoUrl: string
}) {
  const { data } = await apiClient.post<UserVideo>("/api/videos", payload)
  return data
}

export async function fetchEvaluationAttempts(courseId: number) {
  const { data } = await apiClient.get<EvaluationAttempt[]>(
    `/api/evaluation/course/${courseId}`,
  )
  return data
}

export async function submitEvaluation(payload: { courseId: number; videoKey: string }) {
  const { data } = await apiClient.post<{
    evaluationId: number
    status: string
    message: string
  }>("/api/evaluation/submit", payload)
  return data
}

export async function retryEvaluation(courseId: number, videoKey: string) {
  const { data } = await apiClient.post<{
    evaluationId: number
    status: string
    message: string
  }>(`/api/evaluation/${courseId}/retry`, { videoKey })
  return data
}

export async function fetchEvaluationStatus(evaluationId: number) {
  const { data } = await apiClient.get<EvaluationAttempt>(`/api/evaluation/${evaluationId}`)
  return data
}

export async function fetchVideoUnlockEligibility(courseId: number) {
  const { data } = await apiClient.get<{
    eligible: boolean
    minimumScore: number
  }>(`/api/activity/course/${courseId}/video-eligibility`)

  return data
}

async function requestSignedUpload(path: string, filename: string) {
  const { data } = await apiClient.get<SignedUploadResponse>(
    `${path}?filename=${encodeURIComponent(filename)}`,
  )
  return data
}

export async function uploadBlobToSignedUrl(
  uploadUrl: string,
  file: Blob,
  contentType: string,
) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to upload file to storage.")
  }
}

export async function uploadProjectZip(file: File) {
  const signedUpload = await requestSignedUpload("/api/projects/upload-url", file.name)
  await uploadBlobToSignedUrl(
    signedUpload.uploadUrl,
    file,
    file.type || "application/zip",
  )
  return signedUpload
}

export async function uploadExplanationVideo(file: File) {
  const signedUpload = await requestSignedUpload("/api/videos/upload-url", file.name)
  await uploadBlobToSignedUrl(
    signedUpload.uploadUrl,
    file,
    file.type || "video/mp4",
  )
  return signedUpload
}
