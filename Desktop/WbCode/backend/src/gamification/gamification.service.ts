import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateLevel, calculateStreakBonus } from '../common/utils/xp.utils';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

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
    const streak = success ? user.streak + 1 : 0;
    await this.prisma.user.update({ where: { id: userId }, data: { streak } });
    if (success) {
      const bonus = calculateStreakBonus(streak);
      if (bonus > 0) {
        await this.awardXP(userId, bonus, 'Streak bonus');
      }
    }
    return streak;
  }

  async getLeaderboard(limit = 50) {
    return this.prisma.leaderboardEntry.findMany({
      orderBy: { xp: 'desc' },
      take: limit,
      include: { user: true }
    });
  }

  async refreshLeaderboard(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    await this.prisma.leaderboardEntry.upsert({
      where: { userId },
      update: { xp: user.xp },
      create: { userId, xp: user.xp, rank: 0 }
    });
    const entries = await this.prisma.leaderboardEntry.findMany({ orderBy: { xp: 'desc' } });
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

    const grants = badges.filter((badge: { id: number; threshold: number }) => !owned.has(badge.id) && user.xp >= badge.threshold);
    await Promise.all(
      grants.map((badge: { id: number }) =>
        this.prisma.badgeAssignment.create({
          data: { badgeId: badge.id, userId }
        })
      )
    );
  }
}

