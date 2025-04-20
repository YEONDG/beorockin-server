import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizSet } from './entities/quiz-set.entity';
import { QuizCard } from './entities/quiz-card.entity';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { UserStatsModule } from 'src/user-stats/user-stats.module';

@Module({
  imports: [TypeOrmModule.forFeature([QuizSet, QuizCard]), UserStatsModule],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
