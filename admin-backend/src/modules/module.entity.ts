import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('modules')
export class CourseModule {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  courseId!: number

  @Column()
  title!: string

  // order within the course, e.g. 1, 2, 3, 4, 5
  @Column()
  orderIndex!: number

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
