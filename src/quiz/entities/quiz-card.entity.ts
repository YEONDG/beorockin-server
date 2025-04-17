import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuizSet } from './quiz-set.entity';

@Entity('quiz_cards')
export class QuizCard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  question: string;

  @Column('simple-json')
  answers: string[];

  @Column({ name: 'correct_answer' })
  correctAnswer: number;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @ManyToOne(() => QuizSet, (quizSet) => quizSet.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_set_id' })
  quizSet: QuizSet;

  @Column({ name: 'quiz_set_id' })
  quizSetId: number;
}
