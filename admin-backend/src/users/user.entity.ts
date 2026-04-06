import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity('users')
export class User {

  // 🔹 Existing numeric primary key
  @PrimaryGeneratedColumn()
  id!: number

  // 🔹 NEW UUID column (auto-generated)
  @Column({ type: 'uuid', unique: true, generated: 'uuid' })
  uuid!: string

  @Column()
  name!: string

  @Column({ unique: true })
  email!: string

  @Column()
  password!: string

  // 'student' | 'admin'
  @Column({ default: 'student' })
  role!: string

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}