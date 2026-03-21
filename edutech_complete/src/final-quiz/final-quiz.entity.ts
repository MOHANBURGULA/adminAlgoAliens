import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('final_quiz_attempts')
export class FinalQuizAttempt {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: number

  @Column()
  courseId!: number

  // MCQ answers: { questionId: selectedOptionIndex }
  @Column({ type: 'jsonb' })
  answers!: Record<number, number>

  @Column()
  score!: number

  // must be >= 80 to proceed to video evaluation
  @Column({ default: false })
  passed!: boolean

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  attemptedAt!: Date

}
