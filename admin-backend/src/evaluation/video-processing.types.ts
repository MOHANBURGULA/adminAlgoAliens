export const VIDEO_PROCESSING_QUEUE_NAME = 'video-processing'

export type VideoProcessingJobData = {
  evaluationId: number
  userId: number
  courseId: number
  videoKey: string
}
