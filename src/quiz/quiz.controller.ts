import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpStatus,
  HttpException,
  UseGuards,
  Request,
} from '@nestjs/common';

import { CreateQuizSetDto } from './dto/create-quiz-set.dto';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { JwtPayload } from 'src/auth/jwt.strategy';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('sets')
  @UseGuards(JwtAuthGuard)
  async createQuizSet(
    @Body() createQuizSetDto: CreateQuizSetDto,
    @Request() req: RequestWithUser,
  ) {
    try {
      const userId = Number(req.user.sub);

      return await this.quizService.createQuizSet(createQuizSetDto, userId);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '퀴즈 세트 생성 중 오류가 발생했습니다';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('sets')
  async findAllQuizSets() {
    return this.quizService.findAllQuizSets();
  }

  @Get('sets/:id')
  async findQuizSetById(@Param('id') id: number) {
    const quizSet = await this.quizService.findQuizSetById(id);
    if (!quizSet) {
      throw new HttpException(
        '해당 ID의 퀴즈 세트를 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );
    }
    return quizSet;
  }

  @Put('sets/:id')
  @UseGuards(JwtAuthGuard)
  async updateQuizSet(
    @Param('id') id: number,
    @Body() updateQuizSetDto: CreateQuizSetDto,
    @Request() req: RequestWithUser,
  ) {
    try {
      const userId = Number(req.user.sub);
      return await this.quizService.updateQuizSet(id, updateQuizSetDto, userId);
    } catch {
      throw new HttpException(
        '퀴즈 세트 업데이트 중 오류가 발생했습니다',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('sets/:id')
  @UseGuards(JwtAuthGuard)
  async removeQuizSet(@Param('id') id: number) {
    const result = await this.quizService.removeQuizSet(id);
    if (!result) {
      throw new HttpException(
        '해당 ID의 퀴즈 세트를 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );
    }
    return { message: '퀴즈 세트가 성공적으로 삭제되었습니다' };
  }
}
