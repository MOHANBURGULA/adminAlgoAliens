import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('module_progress')
export class ModuleProgress {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  userId!: number

  @Column()
  courseId!: number

  @Column()
  moduleId!: number

  // true when student passes the module quiz
  @Column({ default: false })
  completed!: boolean

  @Column({ nullable: true })
  quizScore!: number

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date

}
