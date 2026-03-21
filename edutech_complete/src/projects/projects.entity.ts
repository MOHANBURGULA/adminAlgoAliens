import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('project')
export class Project {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: number

  @Column()
  courseId!: number

  @Column()
  githubLink!: string

  @Column({ nullable: true })
  zipFile!: string

  @Column()
  description!: string

  @Column({ default: 'pending' })
  status!: string

  // Admin feedback when approving or rejecting
  @Column({ nullable: true, type: 'text' })
  feedback!: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
