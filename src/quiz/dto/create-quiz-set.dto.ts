import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCardDto {
  @ApiProperty({
    example: '자바스크립트에서 변수를 선언하는 키워드가 아닌 것은?',
    description: '문제 질문',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    example: ['var', 'let', 'const', 'function'],
    description: '문제 보기 배열 (최소 2개 이상)',
    type: [String],
    minItems: 2,
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  answers: string[];

  @ApiProperty({
    example: 3,
    description: '정답 인덱스 (0부터 시작)',
    minimum: 0,
  })
  @IsNumber()
  correctAnswer: number;

  @ApiProperty({
    example: 'function은 함수를 선언하는 키워드입니다.',
    description: '문제 해설 (선택사항)',
    required: false,
  })
  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateQuizSetDto {
  @ApiProperty({
    example: '자바스크립트 기초 문제집',
    description: '퀴즈 세트 제목',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: '자바스크립트의 기본 문법과 개념을 테스트하는 문제 모음입니다.',
    description: '퀴즈 세트 설명',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: '홍길동',
    description: '퀴즈 세트 작성자 이름 (표시용)',
  })
  @IsString()
  author: string;

  @ApiProperty({
    description: '퀴즈 세트에 포함될 문제 카드 배열',
    type: [CreateCardDto],
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCardDto)
  cards: CreateCardDto[];
}
