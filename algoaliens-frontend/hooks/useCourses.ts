import { useQuery } from "@tanstack/react-query"
import { fetchCourses } from "@/lib/api"

export const useCourses = () => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses
  })
}