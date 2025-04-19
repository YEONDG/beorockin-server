import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStatsController } from './user-stats.controller';
import { UserStatsService } from './user-stats.service';
import { UserStats } from './entities/user-stats.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserStats]),
    UsersModule, // User 엔티티에 접근하기 위해 UsersModule 가져오기
  ],
  controllers: [UserStatsController],
  providers: [UserStatsService],
  exports: [UserStatsService], // 다른 모듈에서 사용할 수 있도록 export
})
export class UserStatsModule {}
