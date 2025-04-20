import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity('user_quiz_progress')
@Index('idx_user_quiz', ['userId', 'quizSetId'])
export class UserQuizProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'quiz_set_id' })
  quizSetId: number;

  @Column({
    type: 'enum',
    enum: ['in_progress', 'completed'],
    default: 'in_progress',
  })
  status: string;

  @Column({
    name: 'started_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt: Date | null;

  @Column({ default: 0 })
  cardsCompleted: number;

  @Column({ default: 0 })
  totalCards: number;

  @Column({
    name: 'quiz_set_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  quizSetName: string | null;
}
