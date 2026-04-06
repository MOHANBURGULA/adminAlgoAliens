import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('evaluations')
export class Evaluation {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: number

  @Column()
  courseId!: number

  // S3 key of the recorded video
  @Column()
  videoKey!: string

  // transcript extracted from video audio (OpenAI Whisper)
  @Column({ type: 'text', nullable: true })
  transcript!: string

  // relevance score from GPT (0–100)
  @Column({ nullable: true })
  relevanceScore!: number

  // plagiarism/AI-detection score from GPT (0–100, higher = more AI-like)
  @Column({ nullable: true })
  aiDetectionScore!: number

  // final combined score used for certificate decision
  @Column({ nullable: true })
  finalScore!: number

  // 'pending' | 'processing' | 'passed' | 'failed'
  @Column({ default: 'pending' })
  status!: string

  // GPT feedback summary
  @Column({ type: 'text', nullable: true })
  feedback!: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
