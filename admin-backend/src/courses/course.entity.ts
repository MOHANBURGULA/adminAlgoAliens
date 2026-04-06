import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

// UPDATED — Change #9: added description, keywords, categoryId fields
@Entity('courses')
export class Course {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column()
  difficulty!: string

  // Change #9 — new fields
  @Column({ type: 'text', nullable: true })
  description!: string | null

  // keywords stored as comma-separated string, split/join in service
  @Column({ type: 'simple-array', nullable: true })
  keywords!: string[] | null

  // FK to course_categories table (uuid string)
  @Column({ type: 'uuid', nullable: true })
  categoryId!: string | null

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
