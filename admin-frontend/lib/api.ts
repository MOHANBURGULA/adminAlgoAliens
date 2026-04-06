import { apiClient } from "./axios"

export const fetchCourses = async () => {
  const res = await apiClient.get("/courses")
  return res.data
}

export const enrollCourse = async (courseId: string) => {
  const res = await apiClient.post("/enroll", { courseId })
  return res.data
}