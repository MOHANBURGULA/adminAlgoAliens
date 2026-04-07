// import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

// @Entity('module_progress')
// export class ModuleProgress {

//   @PrimaryGeneratedColumn()
//   id!: number

//   @Column()
//   userId!: number

//   @Column()
//   courseId!: number

//   @Column()
//   moduleId!: number

//   // true when student passes the module quiz
//   @Column({ default: false })
//   completed!: boolean

//   @Column({ nullable: true })
//   quizScore!: number

//   @Column({ type: 'timestamp', nullable: true })
//   completedAt!: Date

// }


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

  // OLD FIELD (keep for backward compatibility)
  @Column({ default: false })
  completed!: boolean

  // OLD FIELD (keep)
  @Column({ nullable: true })
  quizScore!: number

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date


  // =========================
  // ✅ NEW FIELDS (ADD BELOW)
  // =========================

  // Theory tracking
  @Column({ default: false })
  theoryCompleted!: boolean

  // Activity tracking
  @Column({ type: 'float', default: 0 })
  activityScore!: number

  @Column({ default: false })
  activityPassed!: boolean

  // Video tracking
  @Column({ default: false })
  videoUploaded!: boolean

  @Column({ nullable: true })
  videoUrl!: string

  // Final module completion (NEW LOGIC)
  @Column({ default: false })
  moduleCompleted!: boolean
}
