import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('enrollments')
export class Enrollment {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: number

  @Column()
  courseId!: number

  @Column({ default: 0 })
  progress!: number

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
