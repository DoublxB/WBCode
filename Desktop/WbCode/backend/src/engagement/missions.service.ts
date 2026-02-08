import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMissionDto, MissionProgressDto } from './dto/create-mission.dto';
import { Role } from '../common/constants/roles';
import { GamificationService } from '../gamification/gamification.service';
import { applyMissionProgress } from './mission-progress.util';
import { WBCCoinsService } from '../gamification/wbc-coins.service';

@Injectable()
export class MissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly wbcCoins: WBCCoinsService
  ) {}

  async listActiveMissionsForUser(userId: number) {
    const now = new Date();

    let missions = await this.prisma.weeklyMission.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: { participants: true }
    });

    // If there are no active missions (for example at the beginning of a new week),
    // seed a fresh set of weekly missions so the student always sees something to do.
    if (missions.length === 0) {
      const startOfWeek = new Date();
      const day = startOfWeek.getDay(); // 0 = Sunday
      const diffToMonday = (day + 6) % 7;
      startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      // Try to find any professor/admin to own the missions
      const creator = await this.prisma.user.findFirst({
        where: {
          role: {
            name: {
              in: ['PROFESSOR', 'ADMIN']
            }
          }
        }
      });

      if (creator) {
        // Try to bind some missions to specific CodeLab problems if they exist
        const warmupExercise = await this.prisma.codingExercise.findFirst({
          where: { title: '[Seed] CodeLab #1: Suma a două numere' }
        });

        const dailyExercise = await this.prisma.codingExercise.findFirst({
          where: { title: '[Seed] CodeLab #4: Factorial' }
        });

        await this.prisma.weeklyMission.createMany({
          data: [
            {
              title: 'Warm-up: Solve 3 CodeLab problems',
              description: 'Începe săptămâna cu 3 exerciții Python în CodeLab.',
              goalType: 'CODING',
              goalValue: 3,
              rewardXP: 120,
              status: 'ACTIVE',
              startDate: startOfWeek,
              endDate: endOfWeek,
              creatorId: creator.id,
              codingExerciseId: warmupExercise?.id ?? null
            },
            {
              title: 'CodeLab Grinder: Solve 7 problems',
              description: 'Rezolvă 7 exerciții în CodeLab până la finalul săptămânii.',
              goalType: 'CODING',
              goalValue: 7,
              rewardXP: 220,
              status: 'ACTIVE',
              startDate: startOfWeek,
              endDate: endOfWeek,
              creatorId: creator.id
            },
            {
              title: 'Quiz Sprint: Finish 3 quizzes',
              description: 'Consolidează-ți teoria terminând cel puțin 3 quiz-uri.',
              goalType: 'QUIZZES',
              goalValue: 3,
              rewardXP: 180,
              status: 'ACTIVE',
              startDate: startOfWeek,
              endDate: endOfWeek,
              creatorId: creator.id
            },
            {
              title: 'XP Hunter: Earn 500 XP this week',
              description: 'Adună XP din probleme, quiz-uri și provocări.',
              goalType: 'XP',
              goalValue: 500,
              rewardXP: 250,
              status: 'ACTIVE',
              startDate: startOfWeek,
              endDate: endOfWeek,
              creatorId: creator.id
            },
            {
              title: 'Daily Python Habit (7 zile la rând)',
              description: 'Fă cel puțin o problemă de Python în fiecare zi și marchează-ți progresul.',
              goalType: 'DAILY_CODING',
              goalValue: 7,
              rewardXP: 300,
              status: 'ACTIVE',
              startDate: startOfWeek,
              endDate: endOfWeek,
              creatorId: creator.id,
              codingExerciseId: dailyExercise?.id ?? null
            },
            {
              title: 'Challenge Ready: Win 2 challenges',
              description: 'Intră în arena Challenges și câștigă 2 dueluri.',
              goalType: 'CHALLENGES',
              goalValue: 2,
              rewardXP: 250,
              status: 'ACTIVE',
              startDate: startOfWeek,
              endDate: endOfWeek,
              creatorId: creator.id
            },
            {
              title: 'Study Streak: 5 active days',
              description: 'Intră pe platformă și învață în cel puțin 5 zile diferite.',
              goalType: 'ACTIVE_DAYS',
              goalValue: 5,
              rewardXP: 200,
              status: 'ACTIVE',
              startDate: startOfWeek,
              endDate: endOfWeek,
              creatorId: creator.id
            }
          ]
        });

        missions = await this.prisma.weeklyMission.findMany({
          where: {
            status: 'ACTIVE',
            startDate: { lte: now },
            endDate: { gte: now }
          },
          include: { participants: true }
        });
      }
    }

    // Auto-enroll user into all active missions (no manual join required)
    if (missions.length > 0) {
      await this.prisma.missionParticipant.createMany({
        data: missions.map((m) => ({ missionId: m.id, userId })),
        skipDuplicates: true
      });

      // Re-fetch missions with participants so UI can show progress/claimed state
      missions = await this.prisma.weeklyMission.findMany({
        where: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now }
        },
        include: { participants: true }
      });
    }

    return missions;
  }

  async createMission(user: { id: number; role: Role }, dto: CreateMissionDto) {
    if (![Role.PROFESSOR, Role.ADMIN].includes(user.role)) {
      throw new ForbiddenException('Only professors can create missions');
    }
    return this.prisma.weeklyMission.create({
      data: {
        title: dto.title,
        description: dto.description,
        goalType: dto.goalType,
        goalValue: dto.goalValue,
        rewardXP: dto.rewardXP,
        status: 'ACTIVE',
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        creatorId: user.id
      }
    });
  }

  async joinMission(userId: number, missionId: number) {
    await this.prisma.weeklyMission.findUniqueOrThrow({ where: { id: missionId } });
    return this.prisma.missionParticipant.upsert({
      where: { missionId_userId: { missionId, userId } },
      create: { missionId, userId },
      update: {}
    });
  }

  async submitProgress(userId: number, missionId: number, dto: MissionProgressDto) {
    const mission = await this.prisma.weeklyMission.findUnique({
      where: { id: missionId }
    });
    if (!mission) throw new NotFoundException('Mission not found');

    await applyMissionProgress(this.prisma, this.gamification, userId, mission, dto.progress, this.wbcCoins);

    return this.prisma.missionParticipant.findUnique({
      where: { missionId_userId: { missionId, userId } }
    });
  }

  async claimReward(userId: number, missionId: number) {
    const mission = await this.prisma.weeklyMission.findUnique({ where: { id: missionId } });
    if (!mission) throw new NotFoundException('Mission not found');

    const participant = await this.prisma.missionParticipant.findUnique({
      where: { missionId_userId: { missionId, userId } }
    });
    if (!participant) {
      // auto-enroll safety net
      await this.prisma.missionParticipant.create({ data: { missionId, userId } });
      throw new ForbiddenException('You were not enrolled yet. Please try again.');
    }

    if (!participant.completed) {
      throw new ForbiddenException('Mission not completed yet');
    }
    if (participant.rewardClaimed) {
      return { alreadyClaimed: true, participant };
    }

    // Award XP on claim
    await this.gamification.awardXP(userId, mission.rewardXP, `Mission claimed: ${mission.title}`);

    // Award WBC coins on claim
    const coinsReward = this.wbcCoins.calculateAchievementReward('MISSION_COMPLETE', 'MEDIUM');
    if (coinsReward > 0) {
      await this.wbcCoins.awardCoins(userId, coinsReward, `Mission reward claimed: ${mission.title}`, 'MISSION');
    }

    // Mark claimed
    const updated = await this.prisma.missionParticipant.update({
      where: { missionId_userId: { missionId, userId } },
      data: { rewardClaimed: true, rewardClaimedAt: new Date() }
    });

    // Weekly mission milestone badges based on claimed missions
    const claimedCount = await this.prisma.missionParticipant.count({
      where: { userId, rewardClaimed: true }
    });
    const milestones: { count: number; code: string }[] = [
      { count: 7, code: 'weekly_missions_7' },
      { count: 28, code: 'weekly_missions_28' },
      { count: 56, code: 'weekly_missions_56' }
    ];
    for (const milestone of milestones) {
      if (claimedCount >= milestone.count) {
        await this.gamification.awardBadgeByCode(userId, milestone.code);
      }
    }

    return { success: true, xpAwarded: mission.rewardXP, coinsAwarded: coinsReward, participant: updated };
  }

  async closeExpiredMissions() {
    const now = new Date();
    await this.prisma.weeklyMission.updateMany({
      where: { endDate: { lt: now }, status: 'ACTIVE' },
      data: { status: 'COMPLETED' }
    });
  }
}

