"use client"

import { apiClient } from "./axios"

export type AdminCourse = {
  id: number
  title: string
  difficulty: string
  description?: string
  keywords?: string[]
  categoryId?: string
  moduleCount?: number
  enrollmentCount?: number
  certificateCount?: number
}

export type AdminModule = {
  id: number
  courseId: number
  title: string
  orderIndex: number
}

export type AdminQuestion = {
  id: number
  courseId: number
  moduleId: number
  type: "module" | "final"
  questionText: string
  options: string[]
  correctOptionIndex: number
  expectedAnswer?: string
}

// Change — upload .md files instead of PDFs
export async function uploadBlobWithSignedUrl(
  filename: string,
  file: Blob,
  contentType: string,
) {
  const uploadRes = await apiClient.get(
    `/api/admin/modules/documents/upload-url?filename=${encodeURIComponent(filename)}`,
  )

  const { uploadUrl, key } = uploadRes.data as { uploadUrl: string; key: string }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  })

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to storage")
  }

  return {
    key,
    fileUrl: uploadUrl.split("?")[0],
  }
}

// Change — seed now creates .md files instead of PDFs
export function createSimpleMdBlob(title: string) {
  const content = `# ${title}\n\nThis is a placeholder document for **${title}**.\n\nReplace this content with the actual course material.\n`
  return new Blob([content], { type: "text/markdown" })
}

function createModuleQuestions(courseId: number, moduleId: number, moduleTitle: string) {
  return Array.from({ length: 5 }, (_, index) => ({
    courseId,
    moduleId,
    type: "module" as const,
    questionText: `${moduleTitle}: practice question ${index + 1}`,
    options: [
      `${moduleTitle} option A${index + 1}`,
      `${moduleTitle} option B${index + 1}`,
      `${moduleTitle} option C${index + 1}`,
      `${moduleTitle} option D${index + 1}`,
    ],
    correctOptionIndex: index % 4,
  }))
}

function createFinalQuestions(courseId: number, moduleId: number) {
  return Array.from({ length: 5 }, (_, index) => ({
    courseId,
    moduleId,
    type: "final" as const,
    questionText: `Final evaluation question ${index + 1} for Data Structures & Algorithms`,
    options: [
      `Final option A${index + 1}`,
      `Final option B${index + 1}`,
      `Final option C${index + 1}`,
      `Final option D${index + 1}`,
    ],
    correctOptionIndex: index % 4,
    expectedAnswer: `Expected explanation ${index + 1} for arrays, linked lists, stacks, queues, and trees.`,
  }))
}

export async function seedDsaCourse() {
  const existingCourses = (await apiClient.get("/api/admin/courses"))
    .data as AdminCourse[]

  const existingCourse = existingCourses.find(
    (course) => course.title === "Data Structures & Algorithms",
  )

  const course =
    existingCourse ||
    ((await apiClient.post("/api/admin/courses", {
      title: "Data Structures & Algorithms",
      difficulty: "intermediate",
    })).data as AdminCourse)

  const modules = [
    "Arrays",
    "Linked Lists",
    "Stacks",
    "Queues",
    "Trees",
    "Final Evaluation",
  ]

  const existingModules = (await apiClient.get(`/api/courses/${course.id}/modules`))
    .data as AdminModule[]

  const existingQuestions = (await apiClient.get(`/api/admin/questions/${course.id}`))
    .data as AdminQuestion[]

  for (const [index, title] of modules.entries()) {
    let moduleItem =
      existingModules.find((entry) => entry.orderIndex === index + 1) ||
      existingModules.find((entry) => entry.title === title)

    if (!moduleItem) {
      moduleItem = (await apiClient.post("/api/admin/modules", {
        courseId: course.id,
        title,
        orderIndex: index + 1,
      })).data as AdminModule

      existingModules.push(moduleItem)
    }

    const documentTitle = `${title} Theory`
    const existingDocuments = await apiClient.get(
      `/api/courses/${course.id}/modules/${moduleItem.id}/documents`,
    )

    if (!(existingDocuments.data as Array<{ title: string }>).some((doc) => doc.title === documentTitle)) {
      // Change — use .md files instead of PDFs
      const mdBlob = createSimpleMdBlob(documentTitle)
      const upload = await uploadBlobWithSignedUrl(
        `${title.toLowerCase().replace(/\s+/g, "-")}.md`,
        mdBlob,
        "text/markdown",
      )

      await apiClient.post("/api/admin/modules/documents", {
        moduleId: moduleItem.id,
        label: `${index + 1}.1`,
        title: documentTitle,
        fileUrl: upload.fileUrl,
      })
    }

    const existingModuleQuestions = existingQuestions.filter(
      (question) => question.moduleId === moduleItem!.id,
    )

    const questions =
      title === "Final Evaluation"
        ? createFinalQuestions(course.id, moduleItem.id)
        : createModuleQuestions(course.id, moduleItem.id, title)

    if (existingModuleQuestions.length < questions.length) {
      const remainingQuestions = questions.slice(existingModuleQuestions.length)

      for (const question of remainingQuestions) {
        await apiClient.post("/api/admin/questions", question)
      }
    }
  }

  return course
}
