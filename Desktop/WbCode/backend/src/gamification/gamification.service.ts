import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateLevel, calculateStreakBonus } from '../common/utils/xp.utils';
import { WBCCoinsService } from './wbc-coins.service';
import { BadgesService } from './badges.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ActivityEventType } from '@prisma/client';

@Injectable()
export class GamificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wbcCoins: WBCCoinsService,
    private readonly badges: BadgesService,
    private readonly analytics: AnalyticsService
  ) {}

  async awardXP(userId: number, amount: number, reason: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: amount }
      }
    });

    await this.prisma.xPEvent.create({
      data: { userId, delta: amount, reason }
    });

    const level = calculateLevel(updated.xp);
    if (level !== updated.level) {
      await this.prisma.user.update({ where: { id: userId }, data: { level } });
    }

    await this.refreshLeaderboard(userId);
    await this.checkBadges(userId);
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async applyDailyStreak(userId: number, success: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    const previousStreak = user.streak;
    const streak = success ? user.streak + 1 : 0;
    await this.prisma.user.update({ where: { id: userId }, data: { streak } });
    if (!success && previousStreak > 0) {
      await this.analytics.recordEvent(userId, {
        type: 'STREAK_LOST' as ActivityEventType,
        metadata: { previousLength: previousStreak }
      });
    }
    if (success) {
      const bonus = calculateStreakBonus(streak);
      if (bonus > 0) {
        await this.awardXP(userId, bonus, 'Streak bonus');
      }
    }
    return streak;
  }

  /**
   * Shared helper for updating mission participant progress, awarding mission XP
   * and checking mission-based badges. This wraps the core logic from
   * engagement/mission-progress.util so other services (coding/quizzes) can
   * trigger mission progress automatically.
   */
  async applyMissionProgress(
    userId: number,
    mission: { id: number; title: string; goalType: string; goalValue: number; rewardXP: number },
    increment: number
  ) {
    const { applyMissionProgress } = await import('../engagement/mission-progress.util');
    await applyMissionProgress(this.prisma, this, userId, mission, increment, this.wbcCoins);
  }

  /**
   * Award a specific badge to a user by its unique code.
   * This ignores the generic XP threshold logic and is used for
   * special achievements like weekly mission milestones.
   */
  async awardBadgeByCode(userId: number, code: string) {
    const badge = await this.prisma.badge.findUnique({ where: { code } });
    if (!badge) {
      return null;
    }

    const res = await this.badges.awardById(userId, badge.id);

    // Award WBC Coins for badge
    const coinsReward = this.wbcCoins.calculateBadgeReward(badge.code, badge.threshold);
    if (res.awarded && coinsReward > 0) {
      await this.wbcCoins.awardCoins(userId, coinsReward, `Badge earned: ${badge.name}`, 'BADGE');
    }

    return res;
  }

  async getLeaderboard(limit = 50) {
    // Obține perioada curentă (ultimele 30 de zile)
    const periodStart = await this.getCurrentPeriodStart();
    
    return this.prisma.leaderboardEntry.findMany({
      where: {
        periodStartDate: {
          gte: periodStart
        }
      },
      orderBy: { xp: 'desc' },
      take: limit,
      include: { user: true }
    });
  }

  /**
   * Returnează informații despre perioada curentă a leaderboard-ului
   */
  async getPeriodInfo() {
    const periodStart = await this.getCurrentPeriodStart();
    const daysSinceStart = Math.floor((Date.now() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 30 - daysSinceStart);
    const nextResetDate = new Date(periodStart);
    nextResetDate.setDate(nextResetDate.getDate() + 30);

    return {
      periodStartDate: periodStart,
      daysElapsed: daysSinceStart,
      daysRemaining,
      nextResetDate,
      totalDays: 30
    };
  }

  /**
   * Calculează XP-ul unui utilizator din ultimele 30 de zile
   */
  private async calculatePeriodXP(userId: number): Promise<number> {
    const periodStart = await this.getCurrentPeriodStart();
    
    const result = await this.prisma.xPEvent.aggregate({
      where: {
        userId,
        createdAt: {
          gte: periodStart
        }
      },
      _sum: {
        delta: true
      }
    });

    return result._sum.delta || 0;
  }

  /**
   * Obține data de început a perioadei curente (ultimele 30 de zile)
   */
  private async getCurrentPeriodStart(): Promise<Date> {
    // Găsește cea mai recentă perioadă de start din leaderboard
    const latestEntry = await this.prisma.leaderboardEntry.findFirst({
      orderBy: { periodStartDate: 'desc' },
      select: { periodStartDate: true }
    });

    if (!latestEntry) {
      // Prima dată - începe acum
      return new Date();
    }

    const periodStart = latestEntry.periodStartDate;
    const daysSinceStart = Math.floor((Date.now() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

    // Dacă au trecut 30 de zile, începe o nouă perioadă
    if (daysSinceStart >= 30) {
      return new Date(); // Nouă perioadă începe acum
    }

    return periodStart; // Folosește perioada existentă
  }

  async refreshLeaderboard(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // Calculează XP-ul din perioada curentă (ultimele 30 de zile)
    const periodXP = await this.calculatePeriodXP(userId);
    const periodStart = await this.getCurrentPeriodStart();

    await this.prisma.leaderboardEntry.upsert({
      where: { userId },
      update: { 
        xp: periodXP,
        periodStartDate: periodStart
      },
      create: { 
        userId, 
        xp: periodXP, 
        rank: 0,
        periodStartDate: periodStart
      }
    });

    // Recalculează rank-urile pentru toate entry-urile din perioada curentă
    const entries = await this.prisma.leaderboardEntry.findMany({ 
      where: {
        periodStartDate: {
          gte: periodStart
        }
      },
      orderBy: { xp: 'desc' } 
    });
    
    await Promise.all(
      entries.map((entry: { id: number }, index: number) =>
        this.prisma.leaderboardEntry.update({
          where: { id: entry.id },
          data: { rank: index + 1 }
        })
      )
    );
  }

  async checkBadges(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { badges: true }
    });
    if (!user) return;
    const badges = await this.prisma.badge.findMany();
    const owned = new Set(user.badges.map((b: { badgeId: number }) => b.badgeId));

    // Check XP-based badges
    const xpBadgeCodes = new Set(['rookie', 'scholar', 'legend']);
    const xpGrants = badges.filter(
      (badge: { id: number; threshold: number; code: string }) =>
        !owned.has(badge.id) && xpBadgeCodes.has(badge.code) && user.xp >= badge.threshold
    );

    await Promise.all(
      xpGrants.map(async (badge: { id: number; code: string; threshold: number; name: string }) => {
        await this.awardBadge(userId, badge);
      })
    );
  }

  /**
   * Verifică și acordă badge-uri pentru probleme rezolvate
   */
  async checkProblemSolvedBadges(userId: number) {
    // Prisma typings don't support `count({ distinct })` in some versions, so use findMany+distinct.
    const solvedDistinct = await this.prisma.submission.findMany({
      where: {
        userId,
        type: 'CODING',
        score: { gt: 0 }
      },
      distinct: ['codingId'],
      select: { codingId: true }
    });
    const solvedCount = solvedDistinct.length;

    const badges = await this.prisma.badge.findMany({
      where: {
        code: { in: ['problems_solved_10', 'problems_solved_25', 'problems_solved_50', 'problems_solved_100'] }
      }
    });

    const userBadges = await this.prisma.badgeAssignment.findMany({
      where: { userId },
      include: { badge: true }
    });
    const ownedCodes = new Set(userBadges.map(ba => ba.badge.code));

    for (const badge of badges) {
      if (!ownedCodes.has(badge.code) && solvedCount >= badge.threshold) {
        await this.awardBadge(userId, badge);
      }
    }
  }

  /**
   * Verifică și acordă badge-uri pentru probleme rezolvate din prima
   */
  async checkFirstTryBadges(userId: number, codingId: number) {
    // Verifică dacă aceasta este prima submisie reușită pentru această problemă
    const previousSubmissions = await this.prisma.submission.findMany({
      where: {
        userId,
        codingId,
        score: { gt: 0 }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Dacă există mai multe submission-uri reușite, nu este first try
    if (previousSubmissions.length > 1) {
      return;
    }

    // Numără toate problemele rezolvate din prima
    const allCodingSubmissions = await this.prisma.submission.findMany({
      where: {
        userId,
        type: 'CODING',
        score: { gt: 0 }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Grupează după codingId și verifică care au fost rezolvate din prima
    const firstTryProblems = new Set<number>();
    const problemSubmissions = new Map<number, any[]>();

    for (const sub of allCodingSubmissions) {
      if (!sub.codingId) continue;
      if (!problemSubmissions.has(sub.codingId)) {
        problemSubmissions.set(sub.codingId, []);
      }
      problemSubmissions.get(sub.codingId)!.push(sub);
    }

    for (const [codingId, subs] of problemSubmissions.entries()) {
      // Dacă prima submisie pentru această problemă a fost reușită, este first try
      if (subs.length > 0 && subs[0].score > 0) {
        firstTryProblems.add(codingId);
      }
    }

    const firstTryCount = firstTryProblems.size;

    const badges = await this.prisma.badge.findMany({
      where: {
        code: { in: ['first_try_5', 'first_try_15', 'first_try_30'] }
      }
    });

    const userBadges = await this.prisma.badgeAssignment.findMany({
      where: { userId },
      include: { badge: true }
    });
    const ownedCodes = new Set(userBadges.map(ba => ba.badge.code));

    for (const badge of badges) {
      if (!ownedCodes.has(badge.code) && firstTryCount >= badge.threshold) {
        await this.awardBadge(userId, badge);
      }
    }
  }

  /**
   * Verifică și acordă badge-uri pentru cursuri citite
   */
  async checkLessonReadBadges(userId: number) {
    const lessonsReadCount = await this.prisma.lessonRead.count({
      where: { userId }
    });

    const badges = await this.prisma.badge.findMany({
      where: {
        code: { in: ['lessons_read_5', 'lessons_read_10', 'lessons_read_25'] }
      }
    });

    const userBadges = await this.prisma.badgeAssignment.findMany({
      where: { userId },
      include: { badge: true }
    });
    const ownedCodes = new Set(userBadges.map(ba => ba.badge.code));

    for (const badge of badges) {
      if (!ownedCodes.has(badge.code) && lessonsReadCount >= badge.threshold) {
        await this.awardBadge(userId, badge);
      }
    }
  }

  /**
   * Helper pentru acordarea unui badge
   */
  private async awardBadge(userId: number, badge: { id: number; code: string; name: string; threshold: number }) {
    const res = await this.badges.awardById(userId, badge.id);
    
    // Award WBC Coins for badge
    const coinsReward = this.wbcCoins.calculateBadgeReward(badge.code, badge.threshold);
    if (res.awarded && coinsReward > 0) {
      await this.wbcCoins.awardCoins(userId, coinsReward, `Badge earned: ${badge.name}`, 'BADGE');
    }
  }
}

