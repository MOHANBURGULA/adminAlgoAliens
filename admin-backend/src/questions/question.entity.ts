import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('questions')
export class Question {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  courseId!: number

  @Column()
  moduleId!: number

  // 'module' = end-of-module quiz | 'final' = final quiz
  @Column({ default: 'module' })
  type!: string

  @Column()
  questionText!: string

  // stored as JSON array: ["option A", "option B", "option C", "option D"]
  @Column({ type: 'jsonb' })
  options!: string[]

  // index into options array (0-3)
  @Column()
  correctOptionIndex!: number

  // used for final quiz evaluation — what the correct spoken answer should cover
  @Column({ nullable: true, type: 'text' })
  expectedAnswer!: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
