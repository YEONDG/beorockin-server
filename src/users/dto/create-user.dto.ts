import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
    required: true,
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  @IsNotEmpty({ message: '이메일을 입력해주세요' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: '사용자 비밀번호',
    required: true,
    minLength: 6,
  })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다' })
  password: string;

  @ApiProperty({
    example: '홍길동',
    description: '사용자 이름',
    required: true,
  })
  @IsString({ message: '이름을 입력해주세요' })
  @IsNotEmpty({ message: '이름을 입력해주세요' })
  name: string;

  profileImage?: string;
}
