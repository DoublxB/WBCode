import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CodingService } from '../learning/coding.service';
import { SubmitCodeDto } from '../learning/dto/create-coding-exercise.dto';

interface CreateChallengeInput {
  opponentId: number;
  codingExerciseId: number;
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

    const lastSubmission = await this.prisma.submission.findFirst({
      where: { userId, codingId: input.codingExerciseId, score: { gt: 0 } },
      orderBy: { createdAt: 'desc' }
    });
    if (!lastSubmission) throw new ForbiddenException('Solve the exercise before issuing a challenge');

    return this.prisma.challenge.create({
      data: {
        challengerId: userId,
        opponentId: input.opponentId,
        codingExerciseId: input.codingExerciseId,
        status: 'PENDING',
        challengerScore: lastSubmission.score
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

