import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

// UPDATED — Changes #3 & #5:
//   - added 'approved' | 'rejected' | 'permanently_rejected' statuses
//   - added feedback column (admin note shown to user)
//   - added rejectionCount column (tracks how many times rejected)
@Entity('videos')
export class Video {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: number

  // Added for certificate auto-issuance on admin approval (Change #4)
  @Column({ nullable: true })
  courseId!: number

  @Column()
  title!: string

  @Column()
  description!: string

  @Column()
  videoUrl!: string

  // status values: 'under_review' | 'approved' | 'rejected' | 'permanently_rejected'
  @Column({ default: 'under_review' })
  status!: string

  // Change #3 — admin feedback message shown to the user
  @Column({ type: 'text', nullable: true })
  feedback!: string

  // Change #5 — counts how many times this video has been rejected
  @Column({ default: 0 })
  rejectionCount!: number

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
