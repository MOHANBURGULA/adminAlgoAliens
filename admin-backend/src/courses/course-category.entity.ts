import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'

// NEW FILE — Change #11: CourseCategory table
@Entity('course_categories')
export class CourseCategory {

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  name!: string

  @Column({ type: 'text', nullable: true })
  description!: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
