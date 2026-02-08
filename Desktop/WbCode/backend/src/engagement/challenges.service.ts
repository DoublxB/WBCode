import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { BadgesService } from '../gamification/badges.service';
import { CodingService } from '../learning/coding.service';
import { SubmitCodeDto } from '../learning/dto/create-coding-exercise.dto';

interface CreateChallengeInput {
  opponentId: number;
  codingExerciseId?: number;
  category?: string;
  mode?: 'RANDOM' | 'SPECIFIC' | 'AUTO';
}

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly badges: BadgesService,
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
    let selectedExercise: any | null = null;

    // If mode is RANDOM, AUTO, or category is provided, select random exercise
    if (input.mode === 'RANDOM' || input.mode === 'AUTO' || input.category) {
      // For AUTO mode, don't require category - system picks any random exercise
      if (input.mode === 'AUTO') {
        // Get any random published exercise
        const allExercises = await this.prisma.codingExercise.findMany({
          where: {
            status: 'PUBLISHED'
          }
        });
        
        if (allExercises.length === 0) {
          throw new ForbiddenException('No published exercises found');
        }

        // Pick random exercise
        selectedExercise = allExercises[Math.floor(Math.random() * allExercises.length)];
        codingExerciseId = selectedExercise.id;
      } else if (input.category) {
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
        selectedExercise = exercises[Math.floor(Math.random() * exercises.length)];
        codingExerciseId = selectedExercise.id;
      } else {
        throw new ForbiddenException('Category is required for random challenge (or use AUTO mode)');
      }
      
      // Update exercise with category if it doesn't have one
      if (selectedExercise && !selectedExercise.category && input.category) {
        await this.prisma.codingExercise.update({
          where: { id: selectedExercise.id },
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

    if (!codingExerciseId) {
      throw new ForbiddenException('No exercise selected for challenge');
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
    const updated = await this.prisma.challenge.update({
      where: { id: challengeId },
      data: { status: 'ACCEPTED', acceptedAt: new Date() }
    });

    // CHALLENGES badges: accepted count (feature exists)
    const acceptedCount = await this.prisma.challenge.count({
      where: {
        opponentId: userId,
        status: { in: ['ACCEPTED', 'COMPLETED', 'FAILED'] }
      }
    });
    await this.badges.checkChallengesAccepted(userId, acceptedCount);

    return updated;
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
      // Determine winner with current logic:
      // - If opponent succeeds and beats/equals challenger score -> opponent wins
      // - Otherwise challenger wins (including opponent failure)
      const now = new Date();
      const opponentWon = result.success && result.score >= challenge.challengerScore;
      const winnerId = opponentWon ? challenge.opponentId : challenge.challengerId;

      await this.prisma.challenge.update({
        where: { id: challengeId },
        data: {
          opponentScore: result.score,
          status: result.success ? 'COMPLETED' : 'FAILED',
          bonusXP: opponentWon ? 40 : 0,
          completedAt: now,
          winnerId
        }
      });
      if (opponentWon) {
        await this.gamification.awardXP(challenge.challengerId, 40, 'Challenge victory bonus');
      }

      // CHALLENGES badges: wins & streak-ish achievements we can compute from stored results
      const winCount = await this.prisma.challenge.count({
        where: { winnerId: userId, status: { in: ['COMPLETED', 'FAILED'] } }
      });
      await this.badges.checkChallengesWon(userId, winCount);

      // TODO: Implement "Apex Predator" (top 1% win rate) when we add global win-rate percentile calc.
      // TODO: Implement "Tournament Titan" when seasonal tournaments feature is live.

      // Clean Sweep (win with 100% accuracy) can be derived now
      if (winnerId === userId && result.score === 100) {
        await this.badges.awardByCode(userId, 'challenge_clean_sweep');
      }

      // Speed Demon (win in under 2 mins) now possible via completedAt-createdAt
      if (winnerId === userId) {
        const diffMs = now.getTime() - new Date(challenge.createdAt as any).getTime();
        if (diffMs <= 2 * 60 * 1000) {
          await this.badges.awardByCode(userId, 'challenge_speed_demon');
        }
      }

      // Underdog: win against higher-level player (levels exist)
      if (winnerId === userId) {
        const winner = await this.prisma.user.findUnique({ where: { id: userId }, select: { level: true } });
        const loserId = winnerId === challenge.challengerId ? challenge.opponentId : challenge.challengerId;
        const loser = await this.prisma.user.findUnique({ where: { id: loserId }, select: { level: true } });
        if (winner?.level !== undefined && loser?.level !== undefined && winner.level < loser.level) {
          await this.badges.awardByCode(userId, 'challenge_underdog');
        }
      }

      // Win streak (3/5/10 in a row)
      if (winnerId === userId) {
        const recent = await this.prisma.challenge.findMany({
          where: {
            OR: [{ challengerId: userId }, { opponentId: userId }],
            status: { in: ['COMPLETED', 'FAILED'] },
            completedAt: { not: null }
          },
          orderBy: { completedAt: 'desc' },
          take: 20
        });
        let streak = 0;
        for (const c of recent) {
          if (c.winnerId === userId) streak += 1;
          else break;
        }
        if (streak >= 3) await this.badges.awardByCode(userId, 'challenge_win_streak_3');
        if (streak >= 5) await this.badges.awardByCode(userId, 'challenge_win_streak_5');
        if (streak >= 10) await this.badges.awardByCode(userId, 'challenge_win_streak_10');
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

