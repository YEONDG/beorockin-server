import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('user_stats')
export class UserStats {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ default: 0 })
  streakDays: number;

  @Column({ default: 0 })
  completedQuizzes: number;

  @Column({ default: 0 })
  inProgressQuizSets: number;

  @Column({ name: 'last_study_date', type: 'timestamp', nullable: true })
  lastStudyDate: Date | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
