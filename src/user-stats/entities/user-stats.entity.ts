import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_stats')
export class UserStats {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' }) // 컬럼 이름 명시
  user: User;

  @Column({ name: 'user_id' }) // 명시적으로 user_id 컬럼 추가
  @Index() // 성능 향상을 위한 인덱스 추가
  userId: number;

  @Column({ default: 0 })
  streakDays: number;

  @Column({ default: 0 })
  completedQuizzes: number;

  @Column({ default: 0 })
  inProgressQuizSets: number;

  @Column({ name: 'last_study_date', type: 'timestamp', nullable: true })
  lastStudyDate: Date | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
