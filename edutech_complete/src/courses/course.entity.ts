import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('courses')
export class Course {

  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column()
  difficulty!: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

}
