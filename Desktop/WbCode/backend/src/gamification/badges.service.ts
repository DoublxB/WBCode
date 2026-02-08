import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ActivityEventType } from '@prisma/client';

type AwardResult = {
  awarded: boolean;
  badge: any;
};

@Injectable()
export class BadgesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService
  ) {}

  async awardByCode(userId: number, code: string): Promise<AwardResult | null> {
    const badge = await this.prisma.badge.findUnique({ where: { code } });
    if (!badge) return null;
    return this.awardById(userId, badge.id);
  }

  async awardById(userId: number, badgeId: number): Promise<AwardResult> {
    const existing = await this.prisma.badgeAssignment.findUnique({
      where: { badgeId_userId: { badgeId, userId } }
    });
    if (existing) {
      const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
      return { awarded: false, badge };
    }

    const assignment = await this.prisma.badgeAssignment.create({
      data: { userId, badgeId }
    });

    // Emit unlock event for toast feed
    await this.prisma.badgeUnlock.upsert({
      where: { userId_badgeId: { userId, badgeId } },
      create: { userId, badgeId, createdAt: assignment.awardedAt },
      update: { seenAt: null }
    });

    const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
    if (badge) {
      await this.analytics.recordEvent(userId, {
        type: 'BADGE_UNLOCK' as ActivityEventType,
        metadata: { badgeId: badge.id, badgeCode: badge.code, badgeName: badge.name }
      });
    }
    return { awarded: true, badge };
  }

  async markUnlockSeen(userId: number, unlockId: number) {
    const unlock = await this.prisma.badgeUnlock.findUnique({ where: { id: unlockId } });
    if (!unlock || unlock.userId !== userId) return null;
    return this.prisma.badgeUnlock.update({
      where: { id: unlockId },
      data: { seenAt: new Date() }
    });
  }

  async listUnseenUnlocks(userId: number, limit = 5) {
    return this.prisma.badgeUnlock.findMany({
      where: { userId, seenAt: null },
      include: { badge: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  // --------- LIVE FEATURE CHECKERS ----------

  async checkCodeLabProgression(userId: number) {
    const solvedDistinct = await this.prisma.submission.findMany({
      where: { userId, type: 'CODING', score: { gt: 0 } },
      distinct: ['codingId'],
      select: { codingId: true }
    });
    const solvedCount = solvedDistinct.length;

    const totalProblems = await this.prisma.codingExercise.count({
      where: { status: 'PUBLISHED' }
    });

    const badges = await this.prisma.badge.findMany({
      where: { category: 'CODELAB', criteria: 'CODELAB_UNIQUE_SOLVED' },
      orderBy: { threshold: 'asc' }
    });

    for (const badge of badges) {
      if (badge.code === 'codelab_all_solved') {
        if (totalProblems > 0 && solvedCount >= totalProblems) {
          await this.awardById(userId, badge.id);
        }
      } else if (solvedCount >= badge.threshold) {
        await this.awardById(userId, badge.id);
      }
    }
  }

  async checkLoginStreak(userId: number, streak: number) {
    const badges = await this.prisma.badge.findMany({
      where: { category: 'CONSISTENCY', criteria: 'LOGIN_STREAK' },
      orderBy: { threshold: 'asc' }
    });
    for (const badge of badges) {
      if (streak >= badge.threshold) {
        await this.awardById(userId, badge.id);
      }
    }
  }

  async checkFriendsCount(userId: number, friendCount: number) {
    const badges = await this.prisma.badge.findMany({
      where: { category: 'SOCIAL', criteria: 'FRIENDS_COUNT' },
      orderBy: { threshold: 'asc' }
    });
    for (const badge of badges) {
      if (friendCount >= badge.threshold) {
        await this.awardById(userId, badge.id);
      }
    }
  }

  async checkChallengesAccepted(userId: number, acceptedCount: number) {
    const badges = await this.prisma.badge.findMany({
      where: { category: 'CHALLENGES', criteria: 'CHALLENGE_ACCEPTED' },
      orderBy: { threshold: 'asc' }
    });
    for (const badge of badges) {
      if (acceptedCount >= badge.threshold) {
        await this.awardById(userId, badge.id);
      }
    }
  }

  async checkChallengesWon(userId: number, winCount: number) {
    const badges = await this.prisma.badge.findMany({
      where: { category: 'CHALLENGES', criteria: 'CHALLENGE_WON' },
      orderBy: { threshold: 'asc' }
    });
    for (const badge of badges) {
      if (winCount >= badge.threshold) {
        await this.awardById(userId, badge.id);
      }
    }
  }
}





