import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('activity_submissions')
export class ActivitySubmission {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  activityId!: number

  @Column()
  moduleId!: number

  @Column()
  userId!: number

  @Column({ type: 'jsonb' })
  answer!: Record<string, unknown>

  @Column({ type: 'jsonb' })
  result!: Record<string, unknown>

  @Column({ default: 'evaluated' })
  status!: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}
