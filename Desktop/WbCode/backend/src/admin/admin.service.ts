import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';
import { SubmissionType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureAdmin(user: { role: Role }) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin privileges required');
    }
  }

  async listUsers(requester: { role: Role }) {
    this.ensureAdmin(requester);
    const users = await this.prisma.user.findMany({ include: { role: true } });
    // Transform role object to string for frontend
    return users.map(user => ({
      ...user,
      role: user.role.name
    }));
  }

  async updateUserRole(requester: { role: Role }, userId: number, role: Role) {
    this.ensureAdmin(requester);
    const targetRole = await this.prisma.role.findUnique({ where: { name: role } });
    if (!targetRole) throw new NotFoundException('Role not found');
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleId: targetRole.id }
    });
  }

  async getDashboardStats(requester: { role: Role }) {
    this.ensureAdmin(requester);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    // User Statistics
    const totalUsers = await this.prisma.user.count();
    const students = await this.prisma.user.count({
      where: { role: { name: Role.STUDENT } }
    });
    const professors = await this.prisma.user.count({
      where: { role: { name: Role.PROFESSOR } }
    });
    const admins = await this.prisma.user.count({
      where: { role: { name: Role.ADMIN } }
    });

    const newUsersToday = await this.prisma.user.count({
      where: { createdAt: { gte: todayStart } }
    });

    const newUsersThisWeek = await this.prisma.user.count({
      where: { createdAt: { gte: weekStart } }
    });

    // Active users (users with submissions today/this week)
    const activeUsersToday = await this.prisma.submission.findMany({
      where: { createdAt: { gte: todayStart } },
      select: { userId: true },
      distinct: ['userId']
    });

    const activeUsersThisWeek = await this.prisma.submission.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { userId: true },
      distinct: ['userId']
    });

    // Content Statistics
    const totalLessons = await this.prisma.lesson.count();
    const publishedLessons = await this.prisma.lesson.count({
      where: { status: 'PUBLISHED' }
    });

    const totalQuizzes = await this.prisma.quiz.count();
    const publishedQuizzes = await this.prisma.quiz.count({
      where: { status: 'PUBLISHED' }
    });

    const totalCodingExercises = await this.prisma.codingExercise.count();
    const publishedCodingExercises = await this.prisma.codingExercise.count({
      where: { status: 'PUBLISHED' }
    });

    const pendingApprovals = await this.prisma.contentApproval.count({
      where: { status: 'PENDING' }
    });

    const pendingAssignmentApprovals = await this.prisma.classAssignment.count({
      where: { status: 'PENDING_APPROVAL' }
    });

    // Activity Statistics
    const totalSubmissions = await this.prisma.submission.count();
    const submissionsToday = await this.prisma.submission.count({
      where: { createdAt: { gte: todayStart } }
    });
    const submissionsThisWeek = await this.prisma.submission.count({
      where: { createdAt: { gte: weekStart } }
    });

    const avgScore = await this.prisma.submission.aggregate({
      _avg: {
        score: true
      }
    });

    const totalXPResult = await this.prisma.user.aggregate({
      _sum: { xp: true },
      where: { role: { name: Role.STUDENT } }
    });

    const avgXPResult = await this.prisma.user.aggregate({
      _avg: { xp: true },
      where: { role: { name: Role.STUDENT } }
    });

    // Support Statistics
    const openTickets = await this.prisma.supportTicket.count({
      where: { status: 'OPEN' }
    });
    const inProgressTickets = await this.prisma.supportTicket.count({
      where: { status: 'IN_PROGRESS' }
    });
    const resolvedTickets = await this.prisma.supportTicket.count({
      where: { status: 'RESOLVED' }
    });
    const urgentTickets = await this.prisma.supportTicket.count({
      where: { priority: 'URGENT', status: { not: 'RESOLVED' } }
    });

    // System Statistics
    const totalClasses = await this.prisma.class.count();
    const activeClasses = await this.prisma.class.count({
      where: { isActive: true }
    });

    const totalChallenges = await this.prisma.challenge.count();
    const activeChallenges = await this.prisma.challenge.count({
      where: { status: { in: ['PENDING', 'ACCEPTED'] } }
    });

    const totalMissions = await this.prisma.weeklyMission.count();
    const activeMissions = await this.prisma.weeklyMission.count({
      where: { status: 'ACTIVE' }
    });

    // Recent Users
    const recentUsersData = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        role: true
      }
    });

    const recentUsers = recentUsersData.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role.name,
      createdAt: u.createdAt.toISOString()
    }));

    // Recent Submissions
    const recentSubmissions = await this.prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return {
      totalUsers,
      students,
      professors,
      admins,
      newUsersToday,
      newUsersThisWeek,
      activeUsersToday: activeUsersToday.length,
      activeUsersThisWeek: activeUsersThisWeek.length,
      totalLessons,
      publishedLessons,
      totalQuizzes,
      publishedQuizzes,
      totalCodingExercises,
      publishedCodingExercises,
      pendingApprovals,
      pendingAssignmentApprovals,
      totalSubmissions,
      submissionsToday,
      submissionsThisWeek,
      averageScore: Math.round(avgScore._avg.score || 0),
      totalXP: totalXPResult._sum.xp || 0,
      averageXP: Math.round(avgXPResult._avg.xp || 0),
      openTickets,
      inProgressTickets,
      resolvedTickets,
      urgentTickets,
      totalClasses,
      activeClasses,
      totalChallenges,
      activeChallenges,
      totalMissions,
      activeMissions,
      recentUsers,
      recentSubmissions: recentSubmissions.map(s => ({
        id: s.id,
        userId: s.userId,
        userName: `${s.user.firstName} ${s.user.lastName}`,
        type: s.type,
        score: s.score,
        createdAt: s.createdAt.toISOString()
      }))
    };
  }

  async grantAllBadges(requester: { role: Role }, userId: number) {
    this.ensureAdmin(requester);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const badges = await this.prisma.badge.findMany({ select: { id: true } });
    if (badges.length === 0) {
      return { success: true, assigned: 0 };
    }

    const res = await this.prisma.badgeAssignment.createMany({
      data: badges.map((b) => ({ userId, badgeId: b.id })),
      skipDuplicates: true
    });

    return { success: true, assigned: res.count, totalBadges: badges.length };
  }

  async applyDevTools(
    requester: { role: Role },
    userId: number,
    dto: { wbcCoins?: number; xp?: number; level?: number; solvedProblems?: number }
  ) {
    this.ensureAdmin(requester);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // 1) Set currency/xp/level if provided
    if (dto.wbcCoins !== undefined || dto.xp !== undefined || dto.level !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.wbcCoins !== undefined ? { wbcCoins: dto.wbcCoins } : {}),
          ...(dto.xp !== undefined ? { xp: dto.xp } : {}),
          ...(dto.level !== undefined ? { level: dto.level } : {})
        }
      });
    }

    // 2) Mark N CodeLab problems as solved (idempotent)
    let solvedCreated = 0;
    if (dto.solvedProblems !== undefined) {
      const targetCount = Math.max(0, Math.floor(dto.solvedProblems));
      if (targetCount > 0) {
        // Already solved coding IDs (score > 0)
        const existingSolved = await this.prisma.submission.findMany({
          where: {
            userId,
            type: SubmissionType.CODING,
            score: { gt: 0 },
            codingId: { not: null }
          },
          select: { codingId: true },
          distinct: ['codingId']
        });

        const solvedSet = new Set<number>(existingSolved.map((r) => r.codingId!).filter(Boolean));

        // Only "real" CodeLab exercises: non-boss, and de-dupe by title/prompt
        const exercisesRaw = await this.prisma.codingExercise.findMany({
          where: {
            OR: [{ category: null }, { category: { not: { startsWith: 'boss:' } } }]
          },
          orderBy: { id: 'asc' },
          select: { id: true, title: true, prompt: true }
        });

        const normalizeKey = (s: string) =>
          String(s || '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\p{L}\p{N}\s-]/gu, '');

        const seen = new Set<string>();
        const exercises = exercisesRaw.filter((e) => {
          const key = `${normalizeKey(e.title)}::${normalizeKey(String(e.prompt || '')).slice(0, 180)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        const toSolve = exercises.filter((e) => !solvedSet.has(e.id)).slice(0, targetCount);

        if (toSolve.length > 0) {
          // Create one 100% submission per exercise so it becomes "isSolved"
          for (const ex of toSolve) {
            await this.prisma.submission.create({
              data: {
                userId,
                codingId: ex.id,
                type: SubmissionType.CODING,
                sourceCode: '# admin devtools: auto-solved for testing',
                score: 100,
                maxScore: 100,
                feedback: 'Admin devtools: marked as solved.',
                explanation: 'Admin devtools: marked as solved for feature testing.'
              }
            });
            solvedCreated += 1;
          }
        }
      }
    }

    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, wbcCoins: true, xp: true, level: true }
    });

    return {
      ok: true,
      user: updated,
      solvedCreated
    };
  }
}



