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
      where: { userId },
      relations: ['user'],
      select: {
        id: true,
        streakDays: true,
        completedQuizzes: true,
        inProgressQuizSets: true,
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
      userId,
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
    userStats.inProgressQuizSets = 0;
    userStats.lastStudyDate = null;
    userStats.updatedAt = new Date();

    return this.userStatsRepository.save(userStats);
  }

  // 사용자가 공부 중인 문제집 조회
  async getInProgressQuizSets(userId: number) {
    return this.userQuizProgressRepository.find({
      where: {
        userId,
        status: 'in_progress',
      },
      order: {
        startedAt: 'DESC', // 최근에 시작한 문제집 순으로 정렬
      },
    });
  }

  async getAllQuizProgress(userId: number) {
    // userId 직접 사용으로 변경 (성능 개선)
    return this.userQuizProgressRepository.find({
      where: {
        userId,
      },
      order: {
        startedAt: 'DESC', // 최근에 시작한 퀴즈 순서로 정렬
      },
    });
  }

  // 퀴즈셋 시작하기
  async startQuizSet(userId: number, quizSetId: number, quizSetName: string) {
    // 이미 학습 중인지 확인
    const existingProgress = await this.userQuizProgressRepository.findOne({
      where: {
        userId,
        quizSetId,
      },
    });

    if (existingProgress) {
      if (existingProgress.status === 'completed') {
        // 완료된 문제집을 다시 시작하는 경우, 진행 중 상태로 변경
        existingProgress.status = 'in_progress';
        existingProgress.completedAt = null; // 완료 시간 초기화
        await this.userQuizProgressRepository.save(existingProgress);

        // 통계 업데이트: 완료 -1, 진행 중 +1
        const userStats = await this.findByUserId(userId);
        userStats.completedQuizzes = Math.max(
          0,
          userStats.completedQuizzes - 1,
        );
        userStats.inProgressQuizSets += 1;
        await this.userStatsRepository.save(userStats);
      }
      // 이미 진행 중이었다면 상태 변경 없음
      return existingProgress;
    }

    // 새 학습 기록 생성
    const newProgress = this.userQuizProgressRepository.create({
      user: { id: userId },
      userId,
      quizSetId,
      quizSetName,
      status: 'in_progress',
    });

    await this.userQuizProgressRepository.save(newProgress);

    // 사용자 통계 업데이트
    const userStats = await this.findByUserId(userId);
    userStats.inProgressQuizSets += 1;
    userStats.lastStudyDate = new Date(); // 마지막 학습 일시 업데이트
    await this.userStatsRepository.save(userStats);

    return newProgress;
  }

  // 문제집 학습 완료 처리
  async completeQuizSet(userId: number, quizSetId: number) {
    // userId 직접 사용으로 변경 (성능 개선)
    const progress = await this.userQuizProgressRepository.findOne({
      where: {
        userId,
        quizSetId,
      },
    });

    if (!progress) {
      throw new NotFoundException('해당 학습 기록을 찾을 수 없습니다.');
    }

    // 이미 완료 상태면 중복 처리 방지
    if (progress.status === 'completed') {
      return progress;
    }

    progress.status = 'completed';
    progress.completedAt = new Date();
    await this.userQuizProgressRepository.save(progress);

    // 사용자 통계 업데이트
    const userStats = await this.findByUserId(userId);
    userStats.inProgressQuizSets = Math.max(
      0,
      userStats.inProgressQuizSets - 1,
    );
    userStats.completedQuizzes += 1;
    userStats.lastStudyDate = new Date(); // 마지막 학습 일시 업데이트
    await this.userStatsRepository.save(userStats);

    // 연속 학습일 업데이트
    await this.updateStreakDays(userId);

    return progress;
  }

  // 문제집 학습 기록 삭제
  async removeQuizProgress(userId: number, quizSetId: number) {
    // userId 직접 사용으로 변경 (성능 개선)
    const progress = await this.userQuizProgressRepository.findOne({
      where: {
        userId,
        quizSetId,
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
    } else if (progress.status === 'completed') {
      // 완료된 퀴즈였다면 완료 카운트 감소
      const userStats = await this.findByUserId(userId);
      userStats.completedQuizzes = Math.max(0, userStats.completedQuizzes - 1);
      await this.userStatsRepository.save(userStats);
    }

    return this.userQuizProgressRepository.remove(progress);
  }

  // 현재 사용자 학습 진행 중인 퀴즈 세트 수 조회
  async getInProgressQuizSetsCount(userId: number): Promise<number> {
    const count = await this.userQuizProgressRepository.count({
      where: {
        userId,
        status: 'in_progress',
      },
    });

    return count;
  }

  // 사용자 통계 동기화 (진행 중 퀴즈 수 실제 데이터와 동기화)
  async syncUserStats(userId: number): Promise<UserStats> {
    const userStats = await this.findByUserId(userId);
    const inProgressCount = await this.getInProgressQuizSetsCount(userId);

    // 완료된 퀴즈 수 계산
    const completedCount = await this.userQuizProgressRepository.count({
      where: {
        userId,
        status: 'completed',
      },
    });

    // 통계 업데이트
    userStats.inProgressQuizSets = inProgressCount;
    userStats.completedQuizzes = completedCount;
    userStats.updatedAt = new Date();

    return this.userStatsRepository.save(userStats);
  }
}
