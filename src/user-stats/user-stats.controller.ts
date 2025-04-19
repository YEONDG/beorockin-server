import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
}
