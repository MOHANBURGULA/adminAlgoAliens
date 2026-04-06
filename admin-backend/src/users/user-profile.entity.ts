import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('user_profiles')
export class UserProfile {

  @PrimaryGeneratedColumn()
  id!: number

  @Column({ unique: true })
  userId!: number

  @Column()
  skillLevel!: string

  @Column('text', { array: true, default: '{}' })
  interests!: string[]

  @Column({ default: "Not set" })
  goal!: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
