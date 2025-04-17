import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { QuizCard } from './quiz-card.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('quiz_sets')
export class QuizSet {
  @ApiProperty({
    example: 1,
    description: '퀴즈 세트 고유 ID',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: '자바스크립트 기초 문제집',
    description: '퀴즈 세트 제목',
  })
  @Column()
  title: string;

  @ApiProperty({
    example: '자바스크립트의 기본 문법과 개념을 테스트하는 문제 모음입니다.',
    description: '퀴즈 세트 설명',
  })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({
    example: '홍길동',
    description: '퀴즈 세트 작성자 이름 (표시용)',
  })
  @Column()
  author: string;

  @ApiProperty({
    example: 1,
    description: '퀴즈 세트 작성자 ID (외래 키)',
  })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({
    description: '해당 퀴즈 세트를a 만든 사용자',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.quizSets)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({
    example: '2025-04-17T10:30:00Z',
    description: '퀴즈 세트 생성 일시',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    example: '2025-04-17T14:45:00Z',
    description: '퀴즈 세트 마지막 업데이트 일시',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({
    example: 10,
    description: '퀴즈 세트에 포함된 문제 카드 수',
    minimum: 0,
  })
  @Column()
  cardCount: number;

  @ApiProperty({
    description: '퀴즈 세트에 포함된 문제 카드 목록',
    type: () => [QuizCard],
    isArray: true,
  })
  @OneToMany(() => QuizCard, (card) => card.quizSet, { cascade: true })
  cards: QuizCard[];
}
