import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: Number(userId) },
        include: { 
          role: true,
          badges: {
            include: { badge: true },
            orderBy: { awardedAt: 'desc' }
          },
          cosmeticEquips: {
            include: { cosmetic: true }
          }
        }
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      // Transform role object to string for frontend and exclude sensitive fields
      // Also convert DateTime fields to ISO strings
      const result = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        title: user.title,
        bio: (user as any).bio ?? null,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        wbcCoins: user.wbcCoins,
        badges: user.badges?.map((ba: any) => ({
          id: ba.badgeId,
          code: ba.badge?.code,
          name: ba.badge?.name,
          description: ba.badge?.description,
          threshold: ba.badge?.threshold,
          awardedAt: ba.awardedAt ? ba.awardedAt.toISOString() : null
        })) ?? [],
        cosmeticsEquipped: (user as any).cosmeticEquips?.reduce((acc: any, e: any) => {
          acc[e.type] = e.cosmetic?.code ?? null;
          return acc;
        }, {}) ?? {},
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        roleId: user.roleId,
        role: user.role.name,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      };
      return result;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: dto.avatarUrl,
        title: dto.title,
        bio: dto.bio
      }
    });
    return updated;
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      include: { role: true }
    });
    // Transform role object to string for frontend and exclude sensitive fields
    return users.map(user => {
      const { password, passwordResetToken, passwordResetExpires, ...safeUser } = user;
      return {
        ...safeUser,
        role: user.role.name
      };
    });
  }

  async getDashboardStats(userId: number) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        leaderboardEntry: true,
        badges: true
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get submissions
    const allSubmissions = await this.prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const submissionsToday = allSubmissions.filter(s => 
      new Date(s.createdAt) >= todayStart
    );
    const submissionsThisWeek = allSubmissions.filter(s => 
      new Date(s.createdAt) >= weekStart
    );

    // Coding submissions (problems)
    const codingSubmissions = allSubmissions.filter(s => s.type === 'CODING');
    const problemsSolvedToday = codingSubmissions.filter(s => 
      new Date(s.createdAt) >= todayStart && s.score > 0
    ).length;
    const problemsSolvedThisWeek = codingSubmissions.filter(s => 
      new Date(s.createdAt) >= weekStart && s.score > 0
    ).length;

    // Quiz submissions
    const quizSubmissions = allSubmissions.filter(s => s.type === 'QUIZ');
    const quizzesCompletedToday = quizSubmissions.filter(s => 
      new Date(s.createdAt) >= todayStart
    ).length;
    const quizzesCompletedThisWeek = quizSubmissions.filter(s => 
      new Date(s.createdAt) >= weekStart
    ).length;

    // Calculate average score
    const scores = allSubmissions.map(s => s.score / s.maxScore * 100).filter(s => !isNaN(s));
    const averageScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    // Calculate accuracy rate (percentage of submissions with score > 70%)
    const correctSubmissions = allSubmissions.filter(s => 
      s.maxScore > 0 && (s.score / s.maxScore) >= 0.7
    ).length;
    const accuracyRate = allSubmissions.length > 0 
      ? (correctSubmissions / allSubmissions.length) * 100 
      : 0;

    // Calculate average typing speed (mock calculation based on submissions)
    // In a real scenario, this would come from a separate typing metrics table
    // For now, we'll estimate based on submission count and time
    const averageTypingSpeed = this.calculateTypingSpeed(codingSubmissions);

    // Get challenges
    const challenges = await this.prisma.challenge.findMany({
      where: {
        OR: [
          { challengerId: userId },
          { opponentId: userId }
        ],
        status: { in: ['COMPLETED', 'FAILED'] }
      }
    });

    const challengesWon = challenges.filter(c => {
      if (c.challengerId === userId) return c.challengerScore > c.opponentScore;
      return c.opponentScore > c.challengerScore;
    }).length;

    // Get XP events
    const xpEvents = await this.prisma.xPEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const xpGainedToday = xpEvents
      .filter(e => new Date(e.createdAt) >= todayStart)
      .reduce((sum, e) => sum + e.delta, 0);
    
    const xpGainedThisWeek = xpEvents
      .filter(e => new Date(e.createdAt) >= weekStart)
      .reduce((sum, e) => sum + e.delta, 0);

    // Calculate active days this week
    const uniqueDays = new Set(
      submissionsThisWeek.map(s => 
        new Date(s.createdAt).toDateString()
      )
    );
    const activeDaysThisWeek = uniqueDays.size;

    // Calculate time spent (estimate: 5 minutes per submission)
    const timeSpentToday = submissionsToday.length * 5;
    const timeSpentThisWeek = submissionsThisWeek.length * 5;

    // Get leaderboard info
    const leaderboardRank = user.leaderboardEntry?.rank || 0;
    const leaderboardTotal = await this.prisma.leaderboardEntry.count();

    // Get badges
    const badgesEarned = user.badges.length;
    const badgesTotal = await this.prisma.badge.count();

    // Calculate longest streak (simplified - in real app, track this separately)
    const longestStreak = user.streak; // This would need proper tracking

    // Calculate problems solved on first try
    const allCodingSubmissions = await this.prisma.submission.findMany({
      where: {
        userId,
        type: 'CODING',
        score: { gt: 0 }
      },
      orderBy: { createdAt: 'asc' }
    });

    const problemSubmissions = new Map<number, any[]>();
    for (const sub of allCodingSubmissions) {
      if (!sub.codingId) continue;
      if (!problemSubmissions.has(sub.codingId)) {
        problemSubmissions.set(sub.codingId, []);
      }
      problemSubmissions.get(sub.codingId)!.push(sub);
    }

    let firstTryCount = 0;
    for (const [_, subs] of problemSubmissions.entries()) {
      if (subs.length > 0 && subs[0].score > 0) {
        firstTryCount++;
      }
    }

    // Get lessons read count
    const lessonsReadCount = await this.prisma.lessonRead.count({
      where: { userId }
    });

    // Calculate win rate for challenges
    const challengeWinRate = challenges.length > 0 
      ? Math.round((challengesWon / challenges.length) * 100)
      : 0;

    // Get unique problems solved (distinct codingId)
    const uniqueProblemsSolved = await this.prisma.submission.findMany({
      where: {
        userId,
        type: 'CODING',
        score: { gt: 0 }
      },
      distinct: ['codingId'],
      select: { codingId: true }
    });

    return {
      totalXP: user.xp,
      level: user.level,
      xpGainedToday,
      xpGainedThisWeek,
      problemsSolvedToday,
      problemsSolvedThisWeek,
      problemsSolvedTotal: codingSubmissions.filter(s => s.score > 0).length,
      uniqueProblemsSolved: uniqueProblemsSolved.length,
      firstTryCount,
      lessonsReadCount,
      quizzesCompletedToday,
      quizzesCompletedThisWeek,
      averageTypingSpeed,
      averageScore: Math.round(averageScore),
      accuracyRate: Math.round(accuracyRate),
      challengesWon,
      challengesLost: challenges.length - challengesWon,
      challengesTotal: challenges.length,
      challengeWinRate,
      currentStreak: user.streak,
      longestStreak,
      activeDaysThisWeek,
      timeSpentToday,
      timeSpentThisWeek,
      badgesEarned,
      badgesTotal,
      leaderboardRank,
      leaderboardTotal
    };
  }

  private calculateTypingSpeed(codingSubmissions: any[]): number {
    // Mock calculation: estimate WPM based on submissions
    // In a real app, this would come from actual typing metrics
    if (codingSubmissions.length === 0) return 0;
    
    // Estimate: average code length ~200 chars, average time ~10 minutes
    // WPM = (characters / 5) / minutes
    const avgChars = 200;
    const avgMinutes = 10;
    const baseWPM = (avgChars / 5) / avgMinutes;
    
    // Add some variation based on submission count (more practice = faster)
    const practiceBonus = Math.min(codingSubmissions.length * 0.5, 20);
    
    return Math.round(baseWPM + practiceBonus);
  }

  async getNotifications(userId: number) {
    // Get pending challenges
    const pendingChallenges = await this.prisma.challenge.count({
      where: {
        opponentId: userId,
        status: 'PENDING'
      }
    });

    // Get user's classes
    const classMemberships = await this.prisma.classMember.findMany({
      where: {
        studentId: userId
      },
      include: {
        class: true
      }
    });

    // Filter for active classes only
    const activeClassMemberships = classMemberships.filter(cm => cm.class.isActive);
    const classIds = activeClassMemberships.map(cm => cm.classId);
    
    // Get classes with new announcements (created in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const classesWithAnnouncements = await this.prisma.classAnnouncement.findMany({
      where: {
        classId: { in: classIds },
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        classId: true
      },
      distinct: ['classId']
    });

    // Get classes with new assignments (created in last 7 days or with upcoming deadlines)
    const now = new Date();
    const classesWithAssignments = await this.prisma.classAssignment.findMany({
      where: {
        classId: { in: classIds },
        OR: [
          { createdAt: { gte: sevenDaysAgo } },
          { dueDate: { gte: now } }
        ],
        status: 'PUBLISHED'
      },
      select: {
        classId: true
      },
      distinct: ['classId']
    });

    // Combine class notifications
    const classNotificationSet = new Set([
      ...classesWithAnnouncements.map(a => a.classId),
      ...classesWithAssignments.map(a => a.classId)
    ]);

    // Count notifications per class
    const classNotifications: Record<number, number> = {};
    for (const classId of classNotificationSet) {
      const announcementCount = await this.prisma.classAnnouncement.count({
        where: {
          classId,
          createdAt: { gte: sevenDaysAgo }
        }
      });
      const assignmentCount = await this.prisma.classAssignment.count({
        where: {
          classId,
          OR: [
            { createdAt: { gte: sevenDaysAgo } },
            { dueDate: { gte: now } }
          ],
          status: 'PUBLISHED'
        }
      });
      classNotifications[classId] = announcementCount + assignmentCount;
    }

    // Get conversations with unread messages
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        messages: {
          where: {
            senderId: { not: userId },
            readAt: null
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    const chatNotifications: Record<number, number> = {};
    let totalUnreadChats = 0;
    
    for (const conversation of conversations) {
      const unreadCount = conversation.messages.length;
      if (unreadCount > 0) {
        chatNotifications[conversation.id] = unreadCount;
        totalUnreadChats++;
      }
    }

    // Check if weekly missions have been refreshed (missions with startDate in last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const newMissions = await this.prisma.weeklyMission.count({
      where: {
        startDate: { gte: oneDayAgo },
        status: 'ACTIVE'
      }
    });

    return {
      challenges: pendingChallenges,
      classes: classNotificationSet.size,
      chat: totalUnreadChats,
      missions: newMissions > 0,
      classNotifications,
      chatNotifications
    };
  }
}



