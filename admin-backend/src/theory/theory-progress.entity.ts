import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('theory_progress')
@Index(['userId', 'moduleId'], { unique: true })
export class TheoryProgress {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: number

  @Column()
  moduleId!: number

  @Column({ type: 'float', default: 0 })
  scrollPosition!: number

  @Column({ type: 'float', default: 0 })
  percentageCompleted!: number

  @Column({ type: 'int', nullable: true })
  lastPage!: number | null

  @Column({ type: 'float', nullable: true })
  bookmarkScrollPosition!: number | null

  @Column({ type: 'int', nullable: true })
  bookmarkPage!: number | null

  @Column({ default: false })
  completed!: boolean

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date
}
