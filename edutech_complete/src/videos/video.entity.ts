import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('videos')
export class Video {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: number

  @Column({ type: 'int', nullable: true })
  courseId!: number | null

  @Column()
  title!: string

  @Column({ default: '' })
  description!: string

  @Column()
  videoUrl!: string

  @Column({ default: 'under_review' })
  status!: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
