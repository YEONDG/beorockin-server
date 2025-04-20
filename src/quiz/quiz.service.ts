import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { QuizSet } from './entities/quiz-set.entity';
import { QuizCard } from './entities/quiz-card.entity';
import { CreateQuizSetDto } from './dto/create-quiz-set.dto';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(QuizSet)
    private quizSetRepository: Repository<QuizSet>,
    @InjectRepository(QuizCard)
    private quizCardRepository: Repository<QuizCard>,
    private dataSource: DataSource,
  ) {}

  async createQuizSet(
    createQuizSetDto: CreateQuizSetDto,
    userId: number,
  ): Promise<QuizSet> {
    const { cards, ...quizSetData } = createQuizSetDto;

    // 퀴즈 세트 생성
    const quizSet = this.quizSetRepository.create({
      ...quizSetData,
      userId,
      cardCount: cards.length,
    });

    // 퀴즈 세트 저장
    const savedQuizSet = await this.quizSetRepository.save(quizSet);

    // 카드 생성 및 저장
    const quizCards = cards.map((cardData) => {
      return this.quizCardRepository.create({
        ...cardData,
        quizSetId: savedQuizSet.id,
      });
    });

    await this.quizCardRepository.save(quizCards);

    const result = await this.findQuizSetBasicInfo(savedQuizSet.id);
    if (!result) {
      throw new Error(
        `생성된 퀴즈 세트를 찾을 수 없습니다. ID: ${savedQuizSet.id}`,
      );
    }

    return result;
  }

  async findAllQuizSets(): Promise<QuizSet[]> {
    // 문제 카드 내용 없이 퀴즈 세트 목록만 조회
    return this.quizSetRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // 기본 정보만 조회 (카드 제외)
  async findQuizSetBasicInfo(id: number): Promise<QuizSet | null> {
    return this.quizSetRepository.findOne({
      where: { id },
    });
  }

  // 카드 정보를 포함한 전체 조회
  async findQuizSetWithCards(id: number): Promise<QuizSet | null> {
    return this.quizSetRepository.findOne({
      where: { id },
      relations: ['cards'],
    });
  }

  async updateQuizSet(
    id: number,
    updateQuizSetDto: CreateQuizSetDto,
    userId: number,
  ): Promise<QuizSet> {
    // 트랜잭션 시작
    return this.dataSource.transaction(async (manager) => {
      // 먼저 해당 퀴즈 세트가 해당 사용자의 것인지 확인
      const existingQuizSet = await manager.findOne(QuizSet, {
        where: { id, userId },
        relations: ['cards'],
      });

      if (!existingQuizSet) {
        throw new NotFoundException(
          '해당 ID의 퀴즈 세트를 찾을 수 없거나 수정 권한이 없습니다',
        );
      }

      const { cards, ...quizSetData } = updateQuizSetDto;

      // 퀴즈 세트 업데이트
      await manager.update(QuizSet, id, {
        ...quizSetData,
        cardCount: cards.length,
      });

      // 기존 카드 삭제
      await manager.delete(QuizCard, { quizSetId: id });

      // 새 카드 생성 및 저장
      const quizCards = cards.map((cardData) => {
        return manager.create(QuizCard, {
          ...cardData,
          quizSetId: id,
        });
      });

      await manager.save(QuizCard, quizCards);

      // 업데이트된 퀴즈 세트 반환 (트랜잭션 내에서 조회)
      const updatedQuizSet = await manager.findOne(QuizSet, {
        where: { id },
        relations: ['cards'],
      });
      if (!updatedQuizSet) {
        throw new NotFoundException(
          `ID가 ${id}인 퀴즈 세트를 찾을 수 없습니다`,
        );
      }

      return updatedQuizSet;
    });
  }

  async removeQuizSet(id: number): Promise<boolean> {
    const result = await this.quizSetRepository.delete(id);
    return !!result.affected && result.affected > 0;
  }
}
