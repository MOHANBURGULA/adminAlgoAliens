import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('module_documents')
export class ModuleDocument {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  moduleId!: number

  // label shown to student e.g. "1.1", "1.2"
  @Column()
  label!: string

  @Column()
  title!: string

  // S3 URL to the .md file
  @Column()
  fileUrl!: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
