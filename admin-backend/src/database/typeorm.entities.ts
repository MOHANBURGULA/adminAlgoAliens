import { Certificate } from '../certificates/certificate.entity'
import { CourseCategory } from '../courses/course-category.entity'
import { Course } from '../courses/course.entity'
import { Enrollment } from '../enrollments/enrollment.entity'
import { Evaluation } from '../evaluation/evaluation.entity'
import { FinalQuizAttempt } from '../final-quiz/final-quiz.entity'
import { CourseModule } from '../modules/module.entity'
import { ModuleActivity } from '../modules/module-activity.entity'
import { ModuleDocument } from '../modules/module-document.entity'
import { ModuleProgress } from '../modules/module-progress.entity'
import { Project } from '../projects/projects.entity'
import { Question } from '../questions/question.entity'
import { QuizAttempt } from '../quiz-attempts/quiz-attempt.entity'
import { TheoryProgress } from '../theory/theory-progress.entity'
import { TheoryResource } from '../theory/theory-resource.entity'
import { UserProfile } from '../users/user-profile.entity'
import { User } from '../users/user.entity'
import { Video } from '../videos/video.entity'

export const TYPEORM_ENTITIES = [
  Certificate,
  Course,
  CourseCategory,
  CourseModule,
  Enrollment,
  Evaluation,
  FinalQuizAttempt,
  ModuleActivity,
  ModuleDocument,
  ModuleProgress,
  Project,
  Question,
  QuizAttempt,
  TheoryProgress,
  TheoryResource,
  User,
  UserProfile,
  Video,
]
