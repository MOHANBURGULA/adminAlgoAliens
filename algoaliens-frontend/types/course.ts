export interface Course {
  id: string
  title: string
  difficulty: "beginner" | "intermediate" | "advanced"
  progress: number
  enrolled: boolean
}