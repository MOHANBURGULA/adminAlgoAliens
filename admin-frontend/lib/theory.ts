"use client"

import { apiClient } from "./axios"

export type TheoryFileType = "pdf" | "md"

export type TheoryResource = {
  id: number
  moduleId: number
  title: string
  fileUrl: string
  fileType: TheoryFileType
  createdAt: string
}

export type TheoryProgress = {
  id?: number
  userId: number
  moduleId: number
  scrollPosition: number
  percentageCompleted: number
  lastPage: number | null
  bookmarkScrollPosition?: number | null
  bookmarkPage?: number | null
  completed?: boolean
  updatedAt?: string
  unlockedNextStage?: boolean
}

export async function uploadTheoryResource(formData: FormData) {
  const response = await apiClient.post("/api/theory/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })

  return response.data as TheoryResource
}

export async function getTheoryResource(moduleId: number) {
  const response = await apiClient.get(`/api/theory/${moduleId}`)
  return response.data as TheoryResource | null
}

export async function saveTheoryProgress(payload: {
  bookmarkPage?: number | null
  bookmarkScrollPosition?: number | null
  lastPage?: number | null
  markCompleted?: boolean
  moduleId: number
  percentageCompleted?: number
  scrollPosition?: number
}) {
  const response = await apiClient.post("/api/theory/progress", payload)
  return response.data as TheoryProgress
}

export async function getTheoryProgress(moduleId: number, userId: number) {
  const response = await apiClient.get(`/api/theory/progress/${moduleId}/${userId}`)
  return response.data as TheoryProgress | null
}

export function estimateMarkdownReadingMinutes(markdown: string) {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, " $1 ")
    .replace(/[#>*_\-\[\]\(\)]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const wordCount = plainText ? plainText.split(" ").length : 0
  return Math.max(1, Math.ceil(wordCount / 220))
}

export function estimatePdfReadingMinutes(pageCount: number) {
  return Math.max(1, Math.ceil(pageCount * 2))
}

