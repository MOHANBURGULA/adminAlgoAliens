import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class Certificate {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: number

  @Column()
  courseId!: number

  @Column()
  score!: number

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  issuedAt!: Date

}