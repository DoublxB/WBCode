import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ActivityEventType } from '@prisma/client';

@Injectable()
export class WBCCoinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService
  ) {}

  /**
   * Award WBC Coins to a user
   * @param userId User ID
   * @param amount Amount of coins to award
   * @param reason Reason for awarding (e.g., "Exercise completed", "Badge earned")
   * @param source Source of the reward (e.g., "CODING", "QUIZ", "BADGE", "ACHIEVEMENT")
   */
  async awardCoins(
    userId: number,
    amount: number,
    reason: string,
    source?: 'CODING' | 'QUIZ' | 'BADGE' | 'ACHIEVEMENT' | 'MISSION'
  ) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        wbcCoins: { increment: amount }
      }
    });

    try {
      await this.analytics.recordEvent(userId, {
        type: 'COIN_TRANSACTION' as ActivityEventType,
        metadata: { amount, transactionType: 'EARN', reason, source }
      });
    } catch (error) {
      console.warn('Failed to record coin earn event', error);
    }

    return updated;
  }

  /**
   * Spend WBC Coins from a user
   * @param userId User ID
   * @param amount Amount of coins to spend
   * @param reason Reason for spending (e.g., "Hint purchased")
   */
  async spendCoins(userId: number, amount: number, reason: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { wbcCoins: true }
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.wbcCoins < amount) {
      throw new ForbiddenException('Insufficient WBC Coins');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        wbcCoins: { decrement: amount }
      }
    });

    try {
      await this.analytics.recordEvent(userId, {
        type: 'COIN_TRANSACTION' as ActivityEventType,
        metadata: { amount, transactionType: 'BURN', reason }
      });
    } catch (error) {
      console.warn('Failed to record coin burn event', error);
    }

    return updated;
  }

  /**
   * Get user's WBC Coins balance
   */
  async getBalance(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { wbcCoins: true }
    });

    return user?.wbcCoins ?? 0;
  }

  /**
   * Calculate WBC Coins reward based on exercise difficulty
   */
  calculateExerciseReward(difficulty: string, score: number): number {
    if (score < 100) return 0; // Only reward perfect scores
    
    const baseRewards: Record<string, number> = {
      'EASY': 10,
      'BEGINNER': 10,
      'MEDIUM': 20,
      'INTERMEDIATE': 20,
      'HARD': 30,
      'ADVANCED': 30
    };

    return baseRewards[difficulty.toUpperCase()] || 15;
  }

  /**
   * Calculate WBC Coins reward based on quiz performance
   */
  calculateQuizReward(score: number, maxScore: number, questionCount: number): number {
    const percentage = (score / maxScore) * 100;
    if (percentage < 70) return 0; // Only reward good scores
    
    // Base reward per question, scaled by performance
    const basePerQuestion = 2;
    const performanceMultiplier = percentage / 100;
    
    return Math.floor(questionCount * basePerQuestion * performanceMultiplier);
  }

  /**
   * Calculate WBC Coins reward based on badge difficulty/rarity
   */
  calculateBadgeReward(badgeCode: string, badgeThreshold: number): number {
    // Higher threshold = rarer badge = more coins
    if (badgeThreshold >= 10000) return 100; // Legendary
    if (badgeThreshold >= 5000) return 75;   // Epic
    if (badgeThreshold >= 2000) return 50;    // Rare
    if (badgeThreshold >= 1000) return 30;   // Uncommon
    return 20; // Common
  }

  /**
   * Calculate WBC Coins reward for achievements/missions
   */
  calculateAchievementReward(achievementType: string, difficulty: string): number {
    const baseRewards: Record<string, number> = {
      'MISSION_COMPLETE': 25,
      'STREAK_MILESTONE': 15,
      'CHALLENGE_WIN': 40
    };

    const difficultyMultipliers: Record<string, number> = {
      'EASY': 1.0,
      'MEDIUM': 1.5,
      'HARD': 2.0
    };

    const base = baseRewards[achievementType] || 20;
    const multiplier = difficultyMultipliers[difficulty.toUpperCase()] || 1.0;

    return Math.floor(base * multiplier);
  }
}





