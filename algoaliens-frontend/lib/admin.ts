"use client"

import { apiClient } from "./axios"

export type AdminCourse = {
  id: number
  title: string
  difficulty: string
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

export function createSimplePdfBlob(title: string) {
  const content = `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 54 >>
stream
BT /F1 18 Tf 20 80 Td (${title.replace(/[()]/g, "")}) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000010 00000 n
0000000062 00000 n
0000000118 00000 n
0000000213 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
318
%%EOF`

  return new Blob([content], { type: "application/pdf" })
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
      const pdfBlob = createSimplePdfBlob(documentTitle)
      const upload = await uploadBlobWithSignedUrl(
        `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
        pdfBlob,
        "application/pdf",
      )

      await apiClient.post("/api/admin/modules/documents", {
        moduleId: moduleItem.id,
        label: `${index + 1}.1`,
        title: documentTitle,
        fileUrl: upload.fileUrl,
      })
    }

    const existingModuleQuestions = existingQuestions.filter(
      (question) => question.moduleId === moduleItem.id,
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
