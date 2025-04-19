import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStats } from './entities/user-stats.entity';
import { UsersService } from '../users/users.service';
import { UserQuizProgress } from './entities/user-quiz-progress.entity';

@Injectable()
export class UserStatsService {
  constructor(
    @InjectRepository(UserStats)
    private userStatsRepository: Repository<UserStats>,
    @InjectRepository(UserQuizProgress)
    private userQuizProgressRepository: Repository<UserQuizProgress>,
    private usersService: UsersService,
  ) {}

  // 사용자 통계 조회
  async findByUserId(userId: number): Promise<UserStats> {
    const userStats = await this.userStatsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
      select: {
        id: true,
        streakDays: true,
        completedQuizzes: true,
        lastStudyDate: true,
        updatedAt: true,
        user: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          profileImage: true,
        },
      },
    });

    if (!userStats) {
      // 사용자 통계가 없으면 새로 생성
      return this.createUserStats(userId);
    }

    return userStats;
  }

  // 새 사용자 통계 생성
  async createUserStats(userId: number): Promise<UserStats> {
    // 사용자가 존재하는지 확인
    try {
      await this.usersService.findOne(userId);
    } catch {
      throw new NotFoundException(`사용자 ID ${userId}를 찾을 수 없습니다.`);
    }

    const newUserStats = this.userStatsRepository.create({
      user: { id: userId },
      streakDays: 0,
      completedQuizzes: 0,
      lastStudyDate: null,
    });

    return this.userStatsRepository.save(newUserStats);
  }

  // 연속 학습일 업데이트
  async updateStreakDays(userId: number): Promise<UserStats> {
    const userStats = await this.findByUserId(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 날짜의 시작 (자정)

    if (!userStats.lastStudyDate) {
      // 첫 학습
      userStats.streakDays = 1;
      userStats.lastStudyDate = today;
    } else {
      const lastDate = new Date(userStats.lastStudyDate);
      lastDate.setHours(0, 0, 0, 0);

      // 날짜 차이 계산 (밀리초 -> 일)
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // 같은 날에 여러 번 학습한 경우 - 변경 없음
      } else if (diffDays === 1) {
        // 연속으로 다음 날 학습한 경우
        userStats.streakDays += 1;
        userStats.lastStudyDate = today;
      } else {
        // 하루 이상 공백이 있는 경우
        userStats.streakDays = 1;
        userStats.lastStudyDate = today;
      }
    }

    userStats.updatedAt = new Date();
    return this.userStatsRepository.save(userStats);
  }

  // 완료 문제집 수 업데이트
  async incrementCompletedQuizzes(userId: number): Promise<UserStats> {
    const userStats = await this.findByUserId(userId);

    userStats.completedQuizzes += 1;
    userStats.updatedAt = new Date();

    return this.userStatsRepository.save(userStats);
  }

  // 통계 정보 리셋
  async resetStats(userId: number): Promise<UserStats> {
    const userStats = await this.findByUserId(userId);

    userStats.streakDays = 0;
    userStats.completedQuizzes = 0;
    userStats.lastStudyDate = null;
    userStats.updatedAt = new Date();

    return this.userStatsRepository.save(userStats);
  }

  // 사용자가 공부 중인 문제집 조회
  async getInProgressQuizSets(userId: number) {
    return this.userQuizProgressRepository.find({
      where: {
        user: { id: userId },
        status: 'in_progress',
      },
      order: {
        startedAt: 'DESC', // 최근에 시작한 문제집 순으로 정렬
      },
    });
  }

  async getAllQuizProgress(userId: number) {
    return this.userQuizProgressRepository.find({
      where: {
        user: { id: userId },
      },
      order: {
        startedAt: 'DESC', // 최근에 시작한 퀴즈 순서로 정렬
      },
    });
  }

  // 새 문제집 학습 시작 기록
  async startQuizSet(userId: number, quizSetId: number, quizSetName: string) {
    // 이미 학습 중인지 확인
    const existingProgress = await this.userQuizProgressRepository.findOne({
      where: {
        user: { id: userId },
        quizSetId: quizSetId,
      },
    });

    if (existingProgress) {
      // 이미 존재하면 학습 중 상태로 업데이트
      existingProgress.status = 'in_progress';
      return this.userQuizProgressRepository.save(existingProgress);
    }

    // 새 학습 기록 생성
    const newProgress = this.userQuizProgressRepository.create({
      user: { id: userId },
      quizSetId: quizSetId,
      quizSetName: quizSetName,
      status: 'in_progress',
    });

    await this.userQuizProgressRepository.save(newProgress);

    // 사용자 통계 업데이트
    const userStats = await this.findByUserId(userId);
    userStats.inProgressQuizSets += 1;
    await this.userStatsRepository.save(userStats);

    return newProgress;
  }

  // 문제집 학습 완료 처리
  async completeQuizSet(userId: number, quizSetId: number) {
    const progress = await this.userQuizProgressRepository.findOne({
      where: {
        user: { id: userId },
        quizSetId: quizSetId,
      },
    });

    if (!progress) {
      throw new NotFoundException('해당 학습 기록을 찾을 수 없습니다.');
    }

    progress.status = 'completed';
    progress.completedAt = new Date();
    await this.userQuizProgressRepository.save(progress);

    // 사용자 통계 업데이트
    const userStats = await this.findByUserId(userId);
    userStats.inProgressQuizSets -= 1;
    userStats.completedQuizzes += 1;
    await this.userStatsRepository.save(userStats);

    return progress;
  }

  // 문제집 학습 기록 삭제
  async removeQuizProgress(userId: number, quizSetId: number) {
    const progress = await this.userQuizProgressRepository.findOne({
      where: {
        user: { id: userId },
        quizSetId: quizSetId,
      },
    });

    if (!progress) {
      throw new NotFoundException('해당 학습 기록을 찾을 수 없습니다.');
    }

    // 진행 중이었다면 통계에서 카운트 감소
    if (progress.status === 'in_progress') {
      const userStats = await this.findByUserId(userId);
      userStats.inProgressQuizSets = Math.max(
        0,
        userStats.inProgressQuizSets - 1,
      );
      await this.userStatsRepository.save(userStats);
    }

    return this.userQuizProgressRepository.remove(progress);
  }
}
