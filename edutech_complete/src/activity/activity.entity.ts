import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { ActivityType } from './activity-type.enum'

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  moduleId!: number

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType!: ActivityType

  @Column({ type: 'jsonb' })
  content!: Record<string, unknown>

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date
}
