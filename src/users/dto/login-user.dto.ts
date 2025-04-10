import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
    required: true,
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  @IsNotEmpty({ message: '이메일을 입력해주세요' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: '사용자 비밀번호',
    required: true,
  })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다' })
  password: string;
}
