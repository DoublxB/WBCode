import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgesService } from './badges.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ActivityEventType } from '@prisma/client';

@Injectable()
export class GamificationScheduler {
  private readonly logger = new Logger(GamificationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly badges: BadgesService,
    private readonly analytics: AnalyticsService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleStreakReset() {
    this.logger.log('Starting daily streak reset...');
    
    // Reset streaks for users who haven't logged in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const usersToReset = await this.prisma.user.findMany({
      where: {
        streak: { gt: 0 },
        OR: [{ lastLoginAt: null }, { lastLoginAt: { lt: today } }]
      },
      select: { id: true, streak: true }
    });

    if (usersToReset.length > 0) {
      await Promise.all(
        usersToReset.map((user) =>
          this.analytics.recordEvent(user.id, {
            type: 'STREAK_LOST' as ActivityEventType,
            metadata: { previousLength: user.streak }
          })
        )
      );
    }

    const result = await this.prisma.user.updateMany({
      where: {
        OR: [
          { lastLoginAt: null },
          { lastLoginAt: { lt: today } }
        ]
      },
      data: { streak: 0 }
    });
    
    this.logger.log(`Reset streaks for ${result.count} inactive users`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleLeaderboardRegeneration() {
    this.logger.log('Checking if leaderboard reset is needed...');
    
    // Verifică dacă trebuie să reseteze leaderboard-ul (la fiecare 30 de zile)
    const latestEntry = await this.prisma.leaderboardEntry.findFirst({
      orderBy: { periodStartDate: 'desc' },
      select: { periodStartDate: true }
    });

    if (!latestEntry) {
      // Prima dată - inițializează leaderboard-ul
      this.logger.log('Initializing leaderboard for the first time...');
      await this.regenerateLeaderboard();
      return;
    }

    const periodStart = latestEntry.periodStartDate;
    const daysSinceStart = Math.floor((Date.now() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceStart >= 30) {
      this.logger.log(`Resetting leaderboard after ${daysSinceStart} days...`);
      await this.resetLeaderboard();
    } else {
      this.logger.log(`Leaderboard period ongoing: ${daysSinceStart}/30 days`);
      // Doar actualizează XP-urile pentru perioada curentă
      await this.updateCurrentPeriodXP();
    }
  }

  /**
   * Resetează leaderboard-ul pentru o nouă perioadă de 30 de zile
   */
  private async resetLeaderboard() {
    // Before wiping the leaderboard, snapshot the season result and award seasonal badges.
    try {
      await this.finalizeSeasonAndAwardBadges();
    } catch (e) {
      this.logger.error('Failed to finalize season before reset (continuing reset).', e as any);
    }

    // Șterge toate entry-urile vechi (start new season)
    await this.prisma.leaderboardEntry.deleteMany({});
    
    // Regeneră leaderboard-ul cu o nouă perioadă
    await this.regenerateLeaderboard();
    
    this.logger.log('Leaderboard reset completed. New 30-day period started.');
  }

  private async finalizeSeasonAndAwardBadges() {
    const latestEntry = await this.prisma.leaderboardEntry.findFirst({
      orderBy: { periodStartDate: 'desc' },
      select: { periodStartDate: true }
    });
    if (!latestEntry) return;

    const startDate = latestEntry.periodStartDate;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    // If season was already finalized, skip.
    const existingSeason = await this.prisma.leaderboardSeason.findUnique({
      where: { startDate_endDate: { startDate, endDate } }
    });
    if (existingSeason) return;

    // Snapshot top 100 (enough for special seasonal achievements)
    const finalEntries = await this.prisma.leaderboardEntry.findMany({
      orderBy: { xp: 'desc' },
      take: 100
    });

    const season = await this.prisma.leaderboardSeason.create({
      data: { startDate, endDate }
    });

    if (finalEntries.length > 0) {
      await this.prisma.leaderboardSeasonResult.createMany({
        data: finalEntries.map((e, idx) => ({
          seasonId: season.id,
          userId: e.userId,
          rank: idx + 1,
          xp: e.xp
        })),
        skipDuplicates: true
      });
    }

    // Award rank-series badges based on historical results.
    await this.awardSeasonalSeriesBadges(season.id);

    // Photofinish: rank2 is within 10 points of rank1
    if (finalEntries.length >= 2) {
      const diff = finalEntries[0].xp - finalEntries[1].xp;
      if (diff >= 0 && diff < 10) {
        await this.badges.awardByCode(finalEntries[1].userId, 'season_photofinish');
      }
    }

    // TODO: Comeback Kid requires mid-season snapshots (LeaderboardSeasonSnapshot) to be populated during the season.
  }

  private async awardSeasonalSeriesBadges(seasonId: number) {
    const results = await this.prisma.leaderboardSeasonResult.findMany({
      where: { seasonId },
      select: { userId: true, rank: true }
    });

    for (const r of results) {
      // Rank 1/2/3 cumulative series counts
      if (r.rank === 1) {
        const count = await this.prisma.leaderboardSeasonResult.count({ where: { userId: r.userId, rank: 1 } });
        if (count >= 1) await this.badges.awardByCode(r.userId, 'season_season_ruler');
        if (count >= 3) await this.badges.awardByCode(r.userId, 'season_golden_hat_trick');
        if (count >= 6) await this.badges.awardByCode(r.userId, 'season_half_year_sovereign');
        if (count >= 9) await this.badges.awardByCode(r.userId, 'season_nine_tailed_fox');
        if (count >= 12) await this.badges.awardByCode(r.userId, 'season_the_emperor');
      }

      if (r.rank === 2) {
        const count = await this.prisma.leaderboardSeasonResult.count({ where: { userId: r.userId, rank: 2 } });
        if (count >= 1) await this.badges.awardByCode(r.userId, 'season_silver_prince');
        if (count >= 3) await this.badges.awardByCode(r.userId, 'season_silver_trio');
        if (count >= 6) await this.badges.awardByCode(r.userId, 'season_vice_admiral');
        if (count >= 9) await this.badges.awardByCode(r.userId, 'season_noble_serpent');
        if (count >= 12) await this.badges.awardByCode(r.userId, 'season_hand_of_the_king');
      }

      if (r.rank === 3) {
        const count = await this.prisma.leaderboardSeasonResult.count({ where: { userId: r.userId, rank: 3 } });
        if (count >= 1) await this.badges.awardByCode(r.userId, 'season_bronze_baron');
        if (count >= 3) await this.badges.awardByCode(r.userId, 'season_third_pillar');
        if (count >= 6) await this.badges.awardByCode(r.userId, 'season_bronze_keeper');
        if (count >= 9) await this.badges.awardByCode(r.userId, 'season_rising_star');
        if (count >= 12) await this.badges.awardByCode(r.userId, 'season_foundation_stone');
      }

      // Top10 months
      if (r.rank <= 10) {
        const top10 = await this.prisma.leaderboardSeasonResult.count({ where: { userId: r.userId, rank: { lte: 10 } } });
        if (top10 >= 3) await this.badges.awardByCode(r.userId, 'season_top10_regular');
        if (top10 >= 6) await this.badges.awardByCode(r.userId, 'season_top10_elite');
      }

      // Top100 months (1 year ~ 12 seasons)
      if (r.rank <= 100) {
        const top100 = await this.prisma.leaderboardSeasonResult.count({ where: { userId: r.userId, rank: { lte: 100 } } });
        if (top100 >= 12) await this.badges.awardByCode(r.userId, 'season_top100_survivor');
      }
    }
  }

  /**
   * Regeneră leaderboard-ul calculând XP-ul din ultimele 30 de zile
   */
  private async regenerateLeaderboard() {
    const periodStart = new Date();
    const thirtyDaysAgo = new Date(periodStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Obține toți utilizatorii
    const users = await this.prisma.user.findMany({
      select: { id: true },
      where: {
        role: {
          name: 'STUDENT'
        }
      }
    });

    // Calculează XP-ul pentru fiecare utilizator din ultimele 30 de zile
    const entries = await Promise.all(
      users.map(async (user) => {
        const xpResult = await this.prisma.xPEvent.aggregate({
          where: {
            userId: user.id,
            createdAt: {
              gte: thirtyDaysAgo
            }
          },
          _sum: {
            delta: true
          }
        });

        const periodXP = xpResult._sum.delta || 0;

        return {
          userId: user.id,
          xp: periodXP,
          periodStartDate: periodStart,
          rank: 0 // Va fi actualizat mai jos
        };
      })
    );

    // Sortează după XP și atribuie rank-uri
    entries.sort((a, b) => b.xp - a.xp);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Creează entry-urile în baza de date
    if (entries.length > 0) {
      await this.prisma.leaderboardEntry.createMany({
        data: entries
      });
    }

    this.logger.log(`Regenerated leaderboard with ${entries.length} entries for new period`);
  }

  /**
   * Actualizează XP-urile pentru perioada curentă fără să reseteze leaderboard-ul
   */
  private async updateCurrentPeriodXP() {
    const latestEntry = await this.prisma.leaderboardEntry.findFirst({
      orderBy: { periodStartDate: 'desc' },
      select: { periodStartDate: true }
    });

    if (!latestEntry) {
      await this.regenerateLeaderboard();
      return;
    }

    const periodStart = latestEntry.periodStartDate;
    const thirtyDaysAgo = new Date(periodStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Obține toate entry-urile din perioada curentă
    const entries = await this.prisma.leaderboardEntry.findMany({
      where: {
        periodStartDate: {
          gte: periodStart
        }
      }
    });

    // Actualizează XP-ul pentru fiecare entry
    for (const entry of entries) {
      const xpResult = await this.prisma.xPEvent.aggregate({
        where: {
          userId: entry.userId,
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _sum: {
          delta: true
        }
      });

      const periodXP = xpResult._sum.delta || 0;

      await this.prisma.leaderboardEntry.update({
        where: { id: entry.id },
        data: { xp: periodXP }
      });
    }

    // Recalculează rank-urile
    const updatedEntries = await this.prisma.leaderboardEntry.findMany({
      where: {
        periodStartDate: {
          gte: periodStart
        }
      },
      orderBy: { xp: 'desc' }
    });

    await Promise.all(
      updatedEntries.map((entry, index) =>
        this.prisma.leaderboardEntry.update({
          where: { id: entry.id },
          data: { rank: index + 1 }
        })
      )
    );

    this.logger.log(`Updated XP for ${updatedEntries.length} leaderboard entries`);
  }
}













