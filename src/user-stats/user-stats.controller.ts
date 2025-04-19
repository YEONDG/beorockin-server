import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserStatsService } from './user-stats.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('user-stats')
export class UserStatsController {
  constructor(private readonly userStatsService: UserStatsService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  findByUserId(@Param('userId') userId: number) {
    return this.userStatsService.findByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId/in-progress')
  async getInProgressQuizSets(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: Request & { user: { userId: string } },
  ) {
    // 권한 확인 - 자신의 정보만 조회 가능
    const currentUserId = parseInt(req.user.userId);
    if (currentUserId !== userId) {
      throw new ForbiddenException(
        '다른 사용자의 정보를 조회할 권한이 없습니다.',
      );
    }

    return this.userStatsService.getInProgressQuizSets(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId/quiz-progress')
  async getAllQuizProgress(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: Request & { user: { userId: string } },
  ) {
    // 권한 확인 - 자신의 정보만 조회 가능
    const currentUserId = parseInt(req.user.userId);
    if (currentUserId !== userId) {
      throw new ForbiddenException(
        '다른 사용자의 정보를 조회할 권한이 없습니다.',
      );
    }

    return this.userStatsService.getAllQuizProgress(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/quiz-sets/:quizSetId/start')
  async startQuizSet(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('quizSetId', ParseIntPipe) quizSetId: number,
    @Body('quizSetName') quizSetName: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    // 권한 확인
    const currentUserId = parseInt(req.user.userId);
    if (currentUserId !== userId) {
      throw new ForbiddenException(
        '다른 사용자의 정보를 수정할 권한이 없습니다.',
      );
    }

    return this.userStatsService.startQuizSet(userId, quizSetId, quizSetName);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':userId/quiz-sets/:quizSetId/complete')
  async completeQuizSet(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('quizSetId', ParseIntPipe) quizSetId: number,
    @Req() req: Request & { user: { userId: string } },
  ) {
    // 권한 확인
    const currentUserId = parseInt(req.user.userId);
    if (currentUserId !== userId) {
      throw new ForbiddenException(
        '다른 사용자의 정보를 수정할 권한이 없습니다.',
      );
    }

    return this.userStatsService.completeQuizSet(userId, quizSetId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':userId/quiz-sets/:quizSetId')
  async removeQuizProgress(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('quizSetId', ParseIntPipe) quizSetId: number,
    @Req() req: Request & { user: { userId: string } },
  ) {
    // 권한 확인
    const currentUserId = parseInt(req.user.userId);
    if (currentUserId !== userId) {
      throw new ForbiddenException(
        '다른 사용자의 정보를 수정할 권한이 없습니다.',
      );
    }

    return this.userStatsService.removeQuizProgress(userId, quizSetId);
  }
}
