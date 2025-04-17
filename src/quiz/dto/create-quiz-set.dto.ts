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

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  answers: string[];

  @IsNumber()
  correctAnswer: number;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateQuizSetDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  description: string;

  @IsString()
  author: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCardDto)
  cards: CreateCardDto[];
}
