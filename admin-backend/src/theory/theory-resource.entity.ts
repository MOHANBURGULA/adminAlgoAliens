import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('theory_resources')
export class TheoryResource {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  moduleId!: number

  @Column()
  title!: string

  @Column()
  fileUrl!: string

  @Column({ type: 'varchar', length: 10 })
  fileType!: 'pdf' | 'md'

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}
