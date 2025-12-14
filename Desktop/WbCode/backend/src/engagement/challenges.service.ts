import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CodingService } from '../learning/coding.service';
import { SubmitCodeDto } from '../learning/dto/create-coding-exercise.dto';

interface CreateChallengeInput {
  opponentId: number;
  codingExerciseId?: number;
  category?: string;
  mode?: 'RANDOM' | 'SPECIFIC';
}

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly coding: CodingService
  ) {}

  listChallenges(userId: number) {
    return this.prisma.challenge.findMany({
      where: {
        OR: [{ challengerId: userId }, { opponentId: userId }]
      },
      include: { codingExercise: true, challenger: true, opponent: true }
    });
  }

  async createChallenge(userId: number, input: CreateChallengeInput) {
    if (userId === input.opponentId) throw new ForbiddenException('Cannot challenge yourself');

    let codingExerciseId = input.codingExerciseId;
    let challengerScore = 0;

    // If mode is RANDOM or category is provided, select random exercise from category
    if (input.mode === 'RANDOM' || input.category) {
      if (!input.category) {
        throw new ForbiddenException('Category is required for random challenge');
      }

      // Get random exercise from category
      // First try to find exercises with the exact category
      let exercises = await this.prisma.codingExercise.findMany({
        where: {
          category: input.category,
          status: 'PUBLISHED'
        }
      });

      // If no exercises found with category, try to find any published exercises
      // This allows challenges to work even if categories aren't set yet
      if (exercises.length === 0) {
        exercises = await this.prisma.codingExercise.findMany({
          where: {
            status: 'PUBLISHED'
          },
          take: 10 // Limit to avoid too many results
        });
        
        if (exercises.length === 0) {
          throw new ForbiddenException('No published exercises found');
        }
      }

      // Pick random exercise
      const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
      codingExerciseId = randomExercise.id;
      
      // Update exercise with category if it doesn't have one
      if (!randomExercise.category) {
        await this.prisma.codingExercise.update({
          where: { id: randomExercise.id },
          data: { category: input.category }
        });
      }

      // Check if user has solved this exercise
      const lastSubmission = await this.prisma.submission.findFirst({
        where: { userId, codingId: codingExerciseId, score: { gt: 0 } },
        orderBy: { createdAt: 'desc' }
      });
      
      if (lastSubmission) {
        challengerScore = lastSubmission.score;
      }
    } else {
      // Specific exercise mode (original behavior)
      if (!codingExerciseId) {
        throw new ForbiddenException('codingExerciseId is required for specific challenge');
      }

      const lastSubmission = await this.prisma.submission.findFirst({
        where: { userId, codingId: codingExerciseId, score: { gt: 0 } },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!lastSubmission) {
        throw new ForbiddenException('Solve the exercise before issuing a challenge');
      }
      
      challengerScore = lastSubmission.score;
    }

    return this.prisma.challenge.create({
      data: {
        challengerId: userId,
        opponentId: input.opponentId,
        codingExerciseId,
        status: 'PENDING',
        challengerScore
      },
      include: { codingExercise: true }
    });
  }

  async acceptChallenge(userId: number, challengeId: number) {
    const challenge = await this.getChallenge(challengeId);
    if (challenge.opponentId !== userId) throw new ForbiddenException('Not your challenge');
    return this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'ACCEPTED' }
    });
  }

  async submitChallengeCode(userId: number, challengeId: number, dto: SubmitCodeDto) {
    const challenge = await this.getChallenge(challengeId);
    if (![challenge.challengerId, challenge.opponentId].includes(userId)) {
      throw new ForbiddenException('Not part of this challenge');
    }

    const result = await this.coding.submit(userId, challenge.codingExerciseId, dto);

    if (userId === challenge.challengerId) {
      await this.prisma.challenge.update({
        where: { id: challengeId },
        data: { challengerScore: result.score }
      });
    } else {
      await this.prisma.challenge.update({
        where: { id: challengeId },
        data: {
          opponentScore: result.score,
          status: result.success ? 'COMPLETED' : 'FAILED',
          bonusXP: result.success && result.score >= challenge.challengerScore ? 40 : 0
        }
      });
      if (result.success && result.score >= challenge.challengerScore) {
        await this.gamification.awardXP(challenge.challengerId, 40, 'Challenge victory bonus');
      }
    }

    return result;
  }

  private async getChallenge(id: number) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }
}

