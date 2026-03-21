import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('quiz_attempts')
export class QuizAttempt {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: number

  @Column()
  courseId!: number

  @Column()
  moduleId!: number

  // answers submitted: { questionId: selectedOptionIndex }
  @Column({ type: 'jsonb' })
  answers!: Record<number, number>

  @Column()
  score!: number

  // passed = score >= threshold (configurable, default 60%)
  @Column({ default: false })
  passed!: boolean

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  attemptedAt!: Date

}
