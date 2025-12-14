import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

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
}



