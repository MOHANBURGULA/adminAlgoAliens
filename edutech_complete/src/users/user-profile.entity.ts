import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  userId!: number;

  @Column({ type: 'varchar', default: '', nullable: true })
  role!: string | null;

  @Column({ type: 'varchar', default: '', nullable: true })
  career_goal!: string | null;

  @Column('text', { array: true, default: '{}', nullable: true })
  skill_domains!: string[] | null;

  @Column()
  skillLevel!: string;

  @Column('text', { array: true, default: '{}' })
  interests!: string[];

  @Column({ default: 'Not set' })
  goal!: string;

  @Column({ type: 'boolean', nullable: true })
  coding_experience!: boolean | null;

  @Column({ type: 'varchar', default: '', nullable: true })
  weekly_hours!: string | null;

  @Column({ type: 'varchar', default: '', nullable: true })
  target_timeline!: string | null;

  @Column({ type: 'boolean', default: false, nullable: true })
  onboarding_completed!: boolean | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
