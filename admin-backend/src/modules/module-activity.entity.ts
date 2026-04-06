import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('module_activities')
export class ModuleActivity {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  moduleId!: number

  @Column()
  title!: string

  @Column({ type: 'text', default: '' })
  description!: string

  @Column()
  activityType!: string

  @Column({ default: 1 })
  orderIndex!: number

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  config!: Record<string, unknown>

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date

}
