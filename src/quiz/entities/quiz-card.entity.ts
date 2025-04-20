import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { QuizSet } from './quiz-set.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('quiz_cards')
export class QuizCard {
  @ApiProperty({
    example: 1,
    description: '문제 카드 고유 ID',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: '자바스크립트에서 변수를 선언하는 키워드가 아닌 것은?',
    description: '문제 질문',
  })
  @Column({ type: 'text' })
  question: string;

  @ApiProperty({
    example: ['var', 'let', 'const', 'function'],
    description: '보기 목록 (배열)',
    isArray: true,
  })
  @Column('simple-json')
  answers: string[];

  @ApiProperty({
    example: 3,
    description: '정답 인덱스 (0부터 시작)',
    minimum: 0,
  })
  @Column({ name: 'correct_answer' })
  correctAnswer: number;

  @ApiProperty({
    example: 'function은 함수를 선언하는 키워드입니다.',
    description: '문제 해설',
    required: false,
    nullable: true,
  })
  @Column({ type: 'text', nullable: true })
  explanation: string;

  @ApiProperty({
    description: '해당 문제가 속한 퀴즈 세트',
    type: () => QuizSet,
  })
  @ManyToOne(() => QuizSet, (quizSet) => quizSet.cards, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_set_id' })
  quizSet: QuizSet;

  @ApiProperty({
    example: 1,
    description: '퀴즈 세트 ID (외래 키)',
  })
  @Column({ name: 'quiz_set_id' })
  @Index()
  quizSetId: number;
}
