import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Entity()
export class User {
  @ApiProperty({
    example: 1,
    description: '사용자 고유 ID',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일 주소(고유값)',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    example: 'hashedPassword',
    description: '암호화된 비밀번호',
  })
  @Column({ nullable: true })
  password: string;

  @ApiProperty({
    example: '홍길동',
    description: '사용자 이름',
  })
  @Column()
  name: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: '프로필 이미지 URL',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  profileImage: string;

  @ApiProperty({
    example: '2025-03-18T09:00:00Z',
    description: '계정 생성 일시',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '2025-03-18T09:30:00Z',
    description: '계정 정보 마지막 수정 일시',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  // 리프레시 토큰과의 관계 추가
  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  // 구글 OAuth 관련 필드 추가
  @ApiProperty({
    example: '123456789012345678901',
    description: '구글 계정 고유 ID',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  googleId: string;

  // 카카오 OAuth 관련 필드 추가
  @ApiProperty({
    example: '123456789012345678901',
    description: '카카오 계정 고유 ID',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  kakaoId: string;

  @ApiProperty({
    example: 'google',
    description: '인증 제공자',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  provider: string;

  @ApiProperty({
    example: true,
    description: '이메일 인증 여부',
    default: false,
  })
  @Column({ default: false })
  isEmailVerified: boolean;

  @ApiProperty({
    example: '2025-03-18T09:35:00Z',
    description: '마지막 로그인 시간',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  lastLoginAt: Date;

  @ApiProperty({
    example: '길동',
    description: '이름',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  firstName: string;

  @ApiProperty({
    example: '홍',
    description: '성',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  lastName: string;
}
