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
  UnauthorizedException,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';

import { CreateQuizSetDto } from './dto/create-quiz-set.dto';
import { QuizService } from './quiz.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserData } from 'src/auth/jwt.strategy';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuizSet } from './entities/quiz-set.entity';
import { UserStatsService } from 'src/user-stats/user-stats.service';

interface RequestWithUser extends Request {
  user: UserData;
}

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly userStatsService: UserStatsService,
  ) {}

  @Post('sets')
  @ApiOperation({
    summary: '퀴즈 세트 생성',
    description: '새로운 퀴즈 세트를 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '퀴즈 세트 생성 성공',
    type: QuizSet,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @UseGuards(JwtAuthGuard)
  async createQuizSet(
    @Body() createQuizSetDto: CreateQuizSetDto,
    @Request() req: RequestWithUser,
  ) {
    try {
      const userSub = req.user?.userId;

      if (userSub === undefined || userSub === null || userSub === '') {
        // sub 값이 없거나 비어있는 경우 - 인증 문제일 수 있음
        throw new UnauthorizedException(
          '유효한 사용자 ID를 토큰에서 찾을 수 없습니다.',
        );
      }

      // parseInt를 사용하고, 10진수 변환 명시, 결과가 NaN인지 확인
      const userId = parseInt(String(userSub), 10);

      if (isNaN(userId)) {
        // sub 값이 숫자로 변환되지 않는 경우
        console.error(
          `[createQuizSet] Invalid user ID format in token sub: ${userSub}`,
        ); // 로그 남기기
        throw new BadRequestException('사용자 ID 형식이 올바르지 않습니다.');
        // 또는 보안상 UnauthorizedException을 던질 수도 있음
      }

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
  async findQuizSetById(@Param('id', ParseIntPipe) id: number) {
    const quizSet = await this.quizService.findQuizSetBasicInfo(id);
    if (!quizSet) {
      throw new HttpException(
        '해당 ID의 퀴즈 세트를 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );
    }
    return quizSet;
  }

  @Post('sets/:id/start')
  @UseGuards(JwtAuthGuard)
  async startQuizSet(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: Request & { user: { userId: number } },
  ) {
    // 카드 정보를 포함한 퀴즈 세트 조회
    const quizSet = await this.quizService.findQuizSetWithCards(id);
    if (!quizSet) {
      throw new HttpException(
        '해당 ID의 퀴즈 세트를 찾을 수 없습니다',
        HttpStatus.NOT_FOUND,
      );
    }

    // 사용자 학습 시작 처리
    const userId = req.user.userId;
    console.log('User ID:', userId);
    await this.userStatsService.startQuizSet(userId, quizSet.id, quizSet.title);

    return quizSet; // 카드 정보를 포함한 전체 퀴즈 세트 반환
  }

  @Put('sets/:id')
  @UseGuards(JwtAuthGuard)
  async updateQuizSet(
    @Param('id') id: number,
    @Body() updateQuizSetDto: CreateQuizSetDto,
    @Request() req: RequestWithUser,
  ) {
    try {
      const userSub = req.user?.userId;

      if (userSub === undefined || userSub === null || userSub === '') {
        // sub 값이 없거나 비어있는 경우 - 인증 문제일 수 있음
        throw new UnauthorizedException(
          '유효한 사용자 ID를 토큰에서 찾을 수 없습니다.',
        );
      }

      // parseInt를 사용하고, 10진수 변환 명시, 결과가 NaN인지 확인
      const userId = parseInt(String(userSub), 10);

      if (isNaN(userId)) {
        // sub 값이 숫자로 변환되지 않는 경우
        console.error(
          `[createQuizSet] Invalid user ID format in token sub: ${userSub}`,
        ); // 로그 남기기
        throw new BadRequestException('사용자 ID 형식이 올바르지 않습니다.');
        // 또는 보안상 UnauthorizedException을 던질 수도 있음
      }

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
