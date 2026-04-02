import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

export type ModuleDocumentStorageKey = {
  bucket?: string
  key: string
  provider?: string
}

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

  // S3 URL to the PDF
  @Column()
  fileUrl!: string

  @Column({ type: 'jsonb', nullable: true })
  storageKey!: ModuleDocumentStorageKey | null

  @Column({ type: 'varchar', nullable: true, default: 'completed' })
  parseStatus!: string | null

  @Column({ nullable: true, type: 'text' })
  parseError!: string | null

  @Column({ nullable: true, type: 'int' })
  pageCount!: number | null

  @Column({ nullable: true, type: 'jsonb' })
  parsedContent!: Record<string, unknown> | null

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
