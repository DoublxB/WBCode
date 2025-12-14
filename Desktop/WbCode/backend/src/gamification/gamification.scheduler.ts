import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GamificationScheduler {
  private readonly logger = new Logger(GamificationScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleStreakReset() {
    this.logger.log('Starting daily streak reset...');
    
    // Reset streaks for users who haven't logged in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
    this.logger.log('Starting leaderboard regeneration...');
    
    // Get all users with their XP
    const users = await this.prisma.user.findMany({
      select: { id: true, xp: true },
      orderBy: { xp: 'desc' },
      take: 50
    });

    // Delete old leaderboard entries
    await this.prisma.leaderboardEntry.deleteMany({});

    // Create new leaderboard entries
    const entries = users.map((user, index) => ({
      userId: user.id,
      rank: index + 1,
      xp: user.xp
    }));

    if (entries.length > 0) {
      await this.prisma.leaderboardEntry.createMany({
        data: entries
      });
    }

    this.logger.log(`Regenerated leaderboard with ${entries.length} entries`);
  }
}










