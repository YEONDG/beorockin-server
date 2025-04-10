import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class RefreshToken {
  @ApiProperty({
    example: 1,
    description: '리프레시 토큰 고유 ID',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: '리프레시 토큰 값',
  })
  @Column()
  token: string;

  @ApiProperty({
    example: 1,
    description: '사용자 ID',
  })
  @Column()
  userId: number;

  @ApiProperty({
    example: '2025-03-25T09:00:00Z',
    description: '토큰 만료 일시',
  })
  @Column()
  expires: Date;

  @ApiProperty({
    example: '2025-03-18T09:00:00Z',
    description: '토큰 생성 일시',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    description: '사용자 에이전트 정보',
    required: false,
  })
  @Column({ nullable: true })
  userAgent: string;

  @ApiProperty({
    example: '192.168.1.1',
    description: 'IP 주소',
    required: false,
  })
  @Column({ nullable: true })
  ipAddress: string;

  @ApiProperty({
    example: true,
    description: '토큰 활성화 상태',
  })
  @Column({ default: true })
  isActive: boolean;

  // 사용자와의 관계 설정
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
